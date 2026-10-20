"use client";

import { useEffect, useMemo, useState } from "react";
import {
  resourcePlanningMock,
  type CandidateMini,
  type ProjectColumn,
} from "@/app/data/resourcePlanningMock";
import { readStoredBoard } from "./boardStorage";
import { getCandidateAlerts, type CandidateAlert } from "./candidateAlerts";
import {
  getProcessStatusIndex,
  isHiredCandidate,
  isInProcessCandidate,
  daysSince,
} from "./candidateStatus";
import type { UserRole } from "./currentUser";
import { stateOf, useAllNotifications, type AppNotification } from "./notifications";
import { buildRoleDemand } from "./roleDemand";
import { useCoverageRatio } from "./sourcingRule";

export type TodoPriority = "high" | "med" | "low";

export type TodoType =
  | "recontact"
  | "sourcing_request"
  | "interview"
  | "stage"
  | "attempts"
  | "nda"
  | "contact"
  | "level"
  | "aging"
  | "standby"
  | "no_candidates"
  | "on_hold"
  | "sourcing_gap"
  | "ready";

export const TODO_TYPES: Record<TodoType, { label: string; icon: string }> = {
  recontact: { label: "Recontact request", icon: "↻" },
  sourcing_request: { label: "Sourcing request", icon: "🔎" },
  interview: { label: "Interview date passed", icon: "📅" },
  stage: { label: "Stuck in stage", icon: "⏱" },
  attempts: { label: "No reply", icon: "📵" },
  nda: { label: "NDA pending", icon: "📄" },
  contact: { label: "No contact", icon: "☎" },
  level: { label: "Below required level", icon: "📉" },
  aging: { label: "Long process", icon: "⌛" },
  standby: { label: "Stand-by review", icon: "🔁" },
  no_candidates: { label: "Position without candidates", icon: "📭" },
  on_hold: { label: "Position on hold", icon: "⏸" },
  sourcing_gap: { label: "Sourcing gap", icon: "🔎" },
  ready: { label: "Ready to present", icon: "✅" },
};

export const PRIORITY_INFO: Record<TodoPriority, { label: string; color: string }> = {
  high: { label: "High priority", color: "#dc2626" },
  med: { label: "Medium", color: "#d97706" },
  low: { label: "Low", color: "#64748b" },
};

export type TodoAction =
  | { kind: "candidate"; candidateId: string }
  | { kind: "position"; positionId: string }
  | { kind: "sourcing" };

export type TodoItem = {
  id: string;
  type: TodoType;
  priority: TodoPriority;
  title: string;
  context: string;
  // De quién es (para mostrarlo en la vista de todo el equipo)
  owner: string;
  // Quién lo ve: usuarios puntuales y/o todos los de un rol
  users: string[];
  roles: UserRole[];
  // Se calcula solo y desaparece cuando se resuelve (true) o hay que cerrarlo a mano (false)
  auto: boolean;
  done: boolean;
  actionLabel: string;
  action: TodoAction;
  notificationId?: string;
  createdAt?: string;
};

const SNOOZE_KEY = "ats-ia:resource-planning:todo-snooze";
const SNOOZE_EVENT = "rp-todo-snooze";

// ---- Posponer (Snooze 1d) ----
type SnoozeMap = Record<string, string>;

function readSnoozes(): SnoozeMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(SNOOZE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return parsed && typeof parsed === "object" ? (parsed as SnoozeMap) : {};
  } catch {
    return {};
  }
}

function writeSnoozes(map: SnoozeMap) {
  try {
    window.localStorage.setItem(SNOOZE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(SNOOZE_EVENT));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }
}

function endOfTomorrow() {
  const date = new Date();

  date.setDate(date.getDate() + 1);
  date.setHours(8, 0, 0, 0);

  return date.toISOString();
}

export function snoozeTodo(user: string, itemId: string) {
  writeSnoozes({ ...readSnoozes(), [`${user}:${itemId}`]: endOfTomorrow() });
}

export function unsnoozeTodo(user: string, itemId: string) {
  const map = { ...readSnoozes() };

  delete map[`${user}:${itemId}`];
  writeSnoozes(map);
}

function isSnoozed(map: SnoozeMap, user: string, itemId: string) {
  const until = map[`${user}:${itemId}`];

  return Boolean(until) && new Date(until).getTime() > Date.now();
}

// ---- Armado de la lista ----
const ALERT_TYPE: Record<string, { type: TodoType; priority: (alert: CandidateAlert) => TodoPriority; label: string }> = {
  interview: { type: "interview", priority: () => "high", label: "Log result" },
  stage: { type: "stage", priority: (a) => (a.tone === "danger" ? "high" : "med"), label: "Open candidate" },
  attempts: { type: "attempts", priority: () => "high", label: "Open candidate" },
  nda: { type: "nda", priority: () => "med", label: "Open candidate" },
  level: { type: "level", priority: () => "med", label: "Open candidate" },
  contact: { type: "contact", priority: () => "low", label: "Log contact" },
  aging: { type: "aging", priority: () => "low", label: "Open candidate" },
};

const today = () => new Date().toISOString().slice(0, 10);

function candidateUsers(candidate: CandidateMini) {
  return [candidate.recruiterOwner, ...(candidate.coRecruiters ?? [])].filter(
    (name): name is string => Boolean(name)
  );
}

export type TodoInput = {
  projects: ProjectColumn[];
  notifications: AppNotification[];
  ratio: number;
};

/** Todo lo que hoy pide atención, de todo el equipo. Cada item dice a quién le toca. */
export function buildTodoItems({ projects, notifications, ratio }: TodoInput): TodoItem[] {
  const items: TodoItem[] = [];
  const peopleById = new Map<string, { role: string; seniority: string }>();
  const candidatesById = new Map<string, CandidateMini>();

  projects.forEach((project) => {
    const ndaApplies = project.confidential && project.ndaRequired !== false;

    project.positions.forEach((position) => {
      const where = `${position.title} · ${position.seniority} · ${project.clientName}`;

      if (position.status === "open" && position.candidates.length === 0) {
        items.push({
          id: `no_candidates:${position.id}`,
          type: "no_candidates",
          priority: "high",
          title: `No candidates yet · ${position.title} · ${position.seniority}`,
          context: `${project.clientName} · open position with nobody linked`,
          owner: position.owner,
          users: [position.owner],
          roles: [],
          auto: true,
          done: false,
          actionLabel: "Open position",
          action: { kind: "position", positionId: position.id },
        });
      }

      if (position.status === "on_hold") {
        items.push({
          id: `on_hold:${position.id}`,
          type: "on_hold",
          priority: "med",
          title: `Position on hold · ${position.title} · ${position.seniority}`,
          context: `${project.projectName} · ${project.clientName} · review it with the client`,
          owner: position.owner,
          users: [position.owner],
          roles: [],
          auto: true,
          done: false,
          actionLabel: "Open position",
          action: { kind: "position", positionId: position.id },
        });
      }

      position.candidates.forEach((candidate) => {
        candidatesById.set(candidate.id, candidate);

        if (!isHiredCandidate(candidate) && !peopleById.has(candidate.id)) {
          peopleById.set(candidate.id, {
            role: candidate.role,
            seniority: candidate.seniority || position.seniority,
          });
        }

        const users = candidateUsers(candidate);
        const owner = candidate.recruiterOwner ?? "";

        // En stand-by no corren los plazos: solo interesa su fecha de revisión
        const alerts =
          candidate.processStatus === "stand_by"
            ? []
            : getCandidateAlerts(candidate, position, ndaApplies);

        alerts.forEach((alert) => {
          const rule = ALERT_TYPE[alert.id];

          if (!rule) {
            return;
          }

          items.push({
            id: `${alert.id}:${candidate.id}:${position.id}`,
            type: rule.type,
            priority: rule.priority(alert),
            title: `${candidate.name} · ${alert.label}`,
            context: where,
            owner,
            users,
            roles: [],
            auto: true,
            done: false,
            actionLabel: rule.label,
            action: { kind: "candidate", candidateId: candidate.id },
          });
        });

        if (
          candidate.processStatus === "stand_by" &&
          candidate.reviewAt &&
          candidate.reviewAt <= today()
        ) {
          items.push({
            id: `standby:${candidate.id}:${position.id}`,
            type: "standby",
            priority: "med",
            title: `Stand-by review due · ${candidate.name}`,
            context: `${where} · review date ${candidate.reviewAt}`,
            owner,
            users,
            roles: [],
            auto: true,
            done: false,
            actionLabel: "Open candidate",
            action: { kind: "candidate", candidateId: candidate.id },
          });
        }

        if (
          isInProcessCandidate(candidate) &&
          candidate.resumeStatus === "resume_ready" &&
          getProcessStatusIndex(candidate.processStatus) >= 0 &&
          getProcessStatusIndex(candidate.processStatus) < getProcessStatusIndex("presented")
        ) {
          items.push({
            id: `ready:${candidate.id}:${position.id}`,
            type: "ready",
            priority: "low",
            title: `Ready to present · ${candidate.name}`,
            context: `${where} · resume ready`,
            owner: position.owner,
            users: [position.owner],
            roles: [],
            auto: true,
            done: false,
            actionLabel: "Open candidate",
            action: { kind: "candidate", candidateId: candidate.id },
          });
        }
      });
    });
  });

  // Roles donde faltan perfiles para las posiciones abiertas: le toca a Talent
  buildRoleDemand(Array.from(peopleById.values()), projects, ratio)
    .filter((demand) => demand.open.some((entry) => !entry.covered))
    .forEach((demand) => {
      const short = demand.open.filter((entry) => !entry.covered);
      const first = short[0];

      items.push({
        id: `sourcing_gap:${demand.key}`,
        type: "sourcing_gap",
        priority: "high",
        title: `Missing profiles · ${demand.role}${first ? ` ${first.seniority}` : ""}`,
        context: `${demand.open.length} open position${demand.open.length === 1 ? "" : "s"} · ${first?.supply ?? 0} matching in the database (we aim for ${ratio} per position)`,
        owner: "Talent",
        users: [],
        roles: ["talent", "admin"],
        auto: true,
        done: false,
        actionLabel: "Ask for sourcing",
        action: { kind: "sourcing" },
      });
    });

  // Pedidos de otras personas (Recontact, sourcing): se cierran a mano o cuando se resuelven
  notifications
    .filter((item) => item.kind === "recontact" || item.kind === "sourcing")
    .forEach((item) => {
      const candidate = item.candidateId ? candidatesById.get(item.candidateId) : undefined;
      const contacted =
        item.kind === "recontact" &&
        candidate?.lastContactAt &&
        new Date(candidate.lastContactAt).getTime() >=
          new Date(item.createdAt.slice(0, 10)).getTime();
      const done = stateOf(item) === "done" || Boolean(contacted);

      items.push({
        id: `request:${item.id}`,
        type: item.kind === "recontact" ? "recontact" : "sourcing_request",
        priority: item.kind === "recontact" ? "high" : "med",
        title: item.text,
        context: `Requested by ${item.from}`,
        owner: item.to,
        users: [item.to],
        roles: [],
        auto: false,
        done,
        actionLabel: item.kind === "recontact" ? "Log contact" : "Open candidates",
        action: item.candidateId
          ? { kind: "candidate", candidateId: item.candidateId }
          : { kind: "sourcing" },
        notificationId: item.id,
        createdAt: item.createdAt,
      });
    });

  return items;
}

export function todoHref(action: TodoAction): string {
  if (action.kind === "candidate") {
    return `/candidates?open=${encodeURIComponent(action.candidateId)}`;
  }

  if (action.kind === "position") {
    return `/jobs?position=${encodeURIComponent(action.positionId)}`;
  }

  return "/todo?tab=sourcing";
}

export function ageLabel(createdAt?: string) {
  const days = daysSince(createdAt);

  if (days === null) {
    return "";
  }

  if (days >= 1) {
    return `${days}d ago`;
  }

  const hours = Math.max(0, Math.floor((Date.now() - new Date(createdAt as string).getTime()) / 3600000));

  return hours < 1 ? "just now" : `${hours}h ago`;
}

export function readProjects(): ProjectColumn[] {
  const stored = readStoredBoard();

  return stored
    ? stored.projects.filter((project) => !stored.archivedIds.includes(project.id))
    : resourcePlanningMock;
}

/** Proyectos del tablero guardado (sin archivados), para pantallas que solo los leen. */
export function useBoardSnapshot() {
  const [projects, setProjects] = useState<ProjectColumn[]>([]);

  useEffect(() => {
    const sync = () => setProjects(readProjects());

    sync();
    window.addEventListener("rp-board", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("rp-board", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return projects;
}

/**
 * Lista de pendientes. Lee el tablero guardado (sin tocarlo), así sirve en cualquier pantalla:
 * el To-Do, el menú, el Dashboard. "team" (solo Talent y Admin) incluye lo de todo el equipo.
 */
export function useTodoItems(user: string, role: UserRole, scope: "mine" | "team" = "mine") {
  const [projects, setProjects] = useState<ProjectColumn[]>([]);
  const [snoozes, setSnoozes] = useState<SnoozeMap>({});
  const notifications = useAllNotifications();
  const [ratio] = useCoverageRatio();

  useEffect(() => {
    const sync = () => {
      setProjects(readProjects());
      setSnoozes(readSnoozes());
    };

    sync();
    window.addEventListener("rp-board", sync);
    window.addEventListener(SNOOZE_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("rp-board", sync);
      window.removeEventListener(SNOOZE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return useMemo(() => {
    const all = buildTodoItems({ projects, notifications, ratio });
    const seeAll = scope === "team" && (role === "talent" || role === "admin");

    const visible = all.filter(
      (item) =>
        seeAll ||
        item.users.includes(user) ||
        (item.roles as string[]).includes(role)
    );

    return visible.map((item) => ({
      item,
      snoozed: !item.done && isSnoozed(snoozes, user, item.id),
    }));
  }, [projects, notifications, ratio, snoozes, user, role, scope]);
}

/** Cantidad de pendientes propios (sin los pospuestos ni los cerrados). */
export function countOpenTodos(entries: ReturnType<typeof useTodoItems>) {
  return entries.filter((entry) => !entry.item.done && !entry.snoozed).length;
}
