"use client";

import { useEffect, useState } from "react";

import type { UserRole } from "./currentUser";

/**
 * Permisos por rol (sección D). Cada fila es un área de la app y cada rol tiene un nivel.
 * El Owner (admin) siempre tiene acceso total y no se edita.
 *
 *   full = ve y edita · view = solo ve · own = solo lo propio · none = sin acceso
 */
export type AccessLevel = "full" | "own" | "view" | "none";

export type AreaId =
  | "dashboard_overview"
  | "dashboard_mine"
  | "dashboard_others"
  | "dashboard_sla"
  | "resource_planning"
  | "candidates"
  | "ai_match"
  | "budget"
  | "salary_notes"
  | "todo_mine"
  | "todo_team"
  | "consultora_candidates"
  | "consultora_positions"
  | "charge_approval"
  | "onboarding"
  | "users";

export type PermissionArea = {
  id: AreaId;
  label: string;
  group: string;
  // Niveles que tiene sentido elegir para esta área
  levels: AccessLevel[];
  // false = el área todavía no existe o se aplica con el backend; se puede configurar pero no tiene efecto aún
  enforced: boolean;
};

export const PERMISSION_AREAS: PermissionArea[] = [
  { id: "dashboard_overview", label: "Overview (projects, pipeline, HR request)", group: "Dashboard", levels: ["full", "none"], enforced: true },
  { id: "dashboard_mine", label: "My metrics", group: "Dashboard", levels: ["full", "own", "none"], enforced: true },
  { id: "dashboard_others", label: "Other recruiters' metrics", group: "Dashboard", levels: ["full", "none"], enforced: true },
  { id: "dashboard_sla", label: "Stage times (SLA)", group: "Dashboard", levels: ["full", "view", "none"], enforced: true },
  { id: "resource_planning", label: "Resource Planning (all projects)", group: "Recruiting", levels: ["full", "none"], enforced: true },
  { id: "candidates", label: "Candidates database", group: "Recruiting", levels: ["full", "own", "none"], enforced: true },
  { id: "ai_match", label: "AI Match", group: "Recruiting", levels: ["full", "none"], enforced: true },
  { id: "budget", label: "Budget (client budgets)", group: "Recruiting", levels: ["full", "view", "none"], enforced: true },
  { id: "salary_notes", label: "Salary expectations and HR notes", group: "Recruiting", levels: ["full", "own", "none"], enforced: false },
  { id: "todo_mine", label: "My To-Do and notifications", group: "To-Do", levels: ["full", "none"], enforced: true },
  { id: "todo_team", label: "Whole team To-Do and sourcing alerts", group: "To-Do", levels: ["full", "none"], enforced: true },
  { id: "consultora_candidates", label: "Consultora candidates (upload profiles)", group: "Consultora", levels: ["full", "view", "own", "none"], enforced: true },
  { id: "consultora_positions", label: "Open positions (only position and seniority)", group: "Consultora", levels: ["full", "view", "none"], enforced: true },
  { id: "charge_approval", label: "Charge approval and invoices", group: "Consultora", levels: ["full", "own", "none"], enforced: true },
  { id: "onboarding", label: "Onboarding process (hired → internal)", group: "Company", levels: ["full", "own", "none"], enforced: true },
  { id: "users", label: "Users and permissions", group: "Company", levels: ["full", "none"], enforced: true },
];

export type PermissionMatrix = Record<AreaId, Record<UserRole, AccessLevel>>;

type Row = [AccessLevel, AccessLevel, AccessLevel, AccessLevel, AccessLevel, AccessLevel, AccessLevel];

// Orden: admin (Owner), talent, recruiter, consultora, it, hr, pm
const DEFAULT_ROWS: Record<AreaId, Row> = {
  dashboard_overview: ["full", "full", "none", "none", "none", "none", "none"],
  dashboard_mine: ["full", "full", "own", "none", "none", "none", "none"],
  dashboard_others: ["full", "full", "none", "none", "none", "none", "none"],
  dashboard_sla: ["full", "full", "none", "none", "none", "none", "none"],
  resource_planning: ["full", "full", "full", "none", "none", "none", "none"],
  candidates: ["full", "full", "full", "own", "none", "none", "none"],
  ai_match: ["full", "full", "none", "none", "none", "none", "none"],
  budget: ["full", "full", "view", "none", "none", "none", "none"],
  salary_notes: ["full", "full", "full", "own", "none", "none", "none"],
  todo_mine: ["full", "full", "full", "none", "none", "none", "none"],
  todo_team: ["full", "full", "none", "none", "none", "none", "none"],
  consultora_candidates: ["full", "full", "view", "own", "none", "none", "none"],
  consultora_positions: ["full", "full", "view", "view", "none", "none", "none"],
  charge_approval: ["full", "full", "none", "own", "none", "none", "none"],
  onboarding: ["full", "full", "own", "none", "own", "own", "own"],
  users: ["full", "none", "none", "none", "none", "none", "none"],
};

export const ROLE_ORDER: UserRole[] = ["admin", "talent", "recruiter", "consultora", "it", "hr", "pm"];

export function defaultPermissions(): PermissionMatrix {
  const matrix = {} as PermissionMatrix;

  (Object.keys(DEFAULT_ROWS) as AreaId[]).forEach((area) => {
    matrix[area] = {} as Record<UserRole, AccessLevel>;
    ROLE_ORDER.forEach((role, index) => {
      matrix[area][role] = DEFAULT_ROWS[area][index];
    });
  });

  return matrix;
}

const PERMISSIONS_KEY = "ats-ia:resource-planning:permissions";
const PERMISSIONS_EVENT = "rp-permissions";

export function readPermissions(): PermissionMatrix {
  const base = defaultPermissions();

  if (typeof window === "undefined") {
    return base;
  }

  try {
    const raw = window.localStorage.getItem(PERMISSIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<PermissionMatrix>) : null;

    if (!parsed) {
      return base;
    }

    PERMISSION_AREAS.forEach((area) => {
      ROLE_ORDER.forEach((role) => {
        const stored = parsed[area.id]?.[role];

        if (stored && area.levels.includes(stored)) {
          base[area.id][role] = stored;
        }
      });
    });

    return base;
  } catch {
    return base;
  }
}

export function savePermissions(matrix: PermissionMatrix) {
  try {
    window.localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(matrix));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }

  window.dispatchEvent(new Event(PERMISSIONS_EVENT));
}

export function resetPermissions() {
  try {
    window.localStorage.removeItem(PERMISSIONS_KEY);
  } catch {
    // ignore
  }

  window.dispatchEvent(new Event(PERMISSIONS_EVENT));
}

export function usePermissions() {
  const [matrix, setMatrix] = useState<PermissionMatrix>(defaultPermissions);

  useEffect(() => {
    const sync = () => setMatrix(readPermissions());

    sync();
    window.addEventListener(PERMISSIONS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(PERMISSIONS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return matrix;
}

/** Nivel de un rol en un área. El Owner siempre tiene acceso total. */
export function levelOf(
  role: UserRole,
  area: AreaId,
  matrix: PermissionMatrix = readPermissions()
): AccessLevel {
  return role === "admin" ? "full" : matrix[area][role];
}

export function canAccess(
  role: UserRole,
  area: AreaId,
  matrix: PermissionMatrix = readPermissions()
) {
  return levelOf(role, area, matrix) !== "none";
}

export const LEVEL_LABELS: Record<AccessLevel, string> = {
  full: "● Full",
  own: "◐ Own only",
  view: "○ View only",
  none: "— No access",
};
