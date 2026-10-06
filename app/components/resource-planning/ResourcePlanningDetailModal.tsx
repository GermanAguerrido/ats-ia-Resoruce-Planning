"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  FileText,
  Flag,
  FlaskConical,
  Globe,
  ImageIcon,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  PauseCircle,
  Plus,
  Search,
  ShieldCheck,
  Smile,
  Underline,
  Unlock,
  UserCheck,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import type {
  CandidateMini,
  CandidateProcessStatus,
  CandidateResumeStatus,
  CandidateTalentType,
  PositionCard as PositionCardType,
  ProjectColumn as ProjectColumnType,
  ProjectStatus,
} from "@/app/data/resourcePlanningMock";
import { CandidateMiniCard } from "./CandidateMiniCard";

type ProjectPriority = ProjectColumnType["priority"];

type CandidateOverride = Partial<{
  processStatus: CandidateProcessStatus;
  resumeStatus: CandidateResumeStatus;
  talentType: CandidateTalentType;
  recruiterOwner: string;
}>;

type PositionOverride = Partial<{
  status: PositionCardType["status"];
  owner: string;
}>;

type ProjectOverride = Partial<{
  status: ProjectStatus;
  priority: ProjectPriority;
  confidential: boolean;
}>;

type Props = {
  project: ProjectColumnType;
  initialPosition?: PositionCardType | null;
  initialCandidate?: CandidateMini | null;
  onClose: () => void;
  onCandidateUpdate?: (
    candidateId: string,
    updates: CandidateOverride
  ) => void;
  onPositionUpdate?: (
    positionId: string,
    updates: PositionOverride
  ) => void;
  onProjectUpdate?: (
    projectId: string,
    updates: ProjectOverride
  ) => void;
  onProjectArchive?: (projectId: string) => void;
  onAddPosition?: (project: ProjectColumnType) => void;
  onAddCandidate?: (
    project: ProjectColumnType,
    position: PositionCardType
  ) => void;
};

type LocalActivity = {
  id: string;
  initials: string;
  text: string;
  meta: string;
  type: "comment" | "activity" | "action";
  author?: string;
  createdAt?: string;
  edited?: boolean;
  reaction?: {
    emoji: string;
    count: number;
    reacted: boolean;
  };
};

type CandidateOverrides = Record<string, CandidateOverride>;
type PositionOverrides = Record<string, PositionOverride>;
type ProjectOverrides = Record<string, ProjectOverride>;

type QuickActionId =
  | "change_candidate_status"
  | "assign_recruiter"
  | "mark_resume_ready"
  | "move_to_trick_internal"
  | "change_position_status"
  | "assign_internal_member"
  | "request_more_candidates"
  | "mark_jd_reviewed"
  | "update_project_priority"
  | "add_project_member"
  | "mark_as_confidential"
  | "request_client_follow_up"
  | "archive_project"
  | "mention_user";

type QuickActionResult = {
  activityText: string;
  nextCandidate?: CandidateMini | null;
  nextPosition?: PositionCardType | null;
  nextProject?: ProjectColumnType | null;
};

const projectStatusConfig = {
  active_search: {
    label: "Active search",
    className: "rp-position-open",
    barClass: "bg-violet-500",
  },
  active_no_search: {
    label: "No open searches",
    className: "rp-status-badge",
    barClass: "bg-zinc-400",
  },
  coming_soon: {
    label: "Coming soon",
    className: "rp-position-on-hold",
    barClass: "bg-amber-500",
  },
  inactive: {
    label: "Inactive",
    className: "rp-position-cancelled",
    barClass: "bg-red-500",
  },
};

const positionStatusConfig = {
  open: {
    label: "Open",
    badgeClass: "rp-position-open",
    barClass: "bg-violet-500",
  },
  hired: {
    label: "Hired",
    badgeClass: "rp-position-hired",
    barClass: "bg-emerald-500",
  },
  on_hold: {
    label: "On hold",
    badgeClass: "rp-position-on-hold",
    barClass: "bg-amber-500",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "rp-position-cancelled",
    barClass: "bg-red-500",
  },
};

const processStatusOrder: CandidateProcessStatus[] = [
  "sourced",
  "contacted",
  "screening",
  "presented",
  "tech_interview",
  "client_interview",
  "offer",
  "hired",
];

const processStatusConfig: Record<
  CandidateProcessStatus,
  { label: string; className: string }
> = {
  sourced: {
    label: "Sourced",
    className: "rp-candidate-contacted",
  },
  contacted: {
    label: "Contacted",
    className: "rp-candidate-contacted",
  },
  screening: {
    label: "Screening",
    className: "rp-candidate-approved",
  },
  presented: {
    label: "Presented",
    className: "rp-candidate-resume",
  },
  tech_interview: {
    label: "Tech Interview",
    className: "rp-candidate-tech-interview",
  },
  client_interview: {
    label: "Client Interview",
    className: "rp-candidate-interviewed",
  },
  offer: {
    label: "Offer",
    className: "rp-candidate-wip-resume",
  },
  hired: {
    label: "Hired",
    className: "rp-candidate-hired",
  },
  rejected: {
    label: "Rejected",
    className: "rp-position-cancelled",
  },
  stand_by: {
    label: "Stand by",
    className: "rp-position-on-hold",
  },
};

const resumeStatusConfig: Record<
  CandidateResumeStatus,
  { label: string; className: string }
> = {
  none: {
    label: "No Resume",
    className: "rp-status-badge",
  },
  wip_resume: {
    label: "WIP Resume",
    className: "rp-candidate-wip-resume",
  },
  resume_ready: {
    label: "Resume Ready",
    className: "rp-candidate-resume",
  },
};

const talentTypeConfig: Record<
  CandidateTalentType,
  { label: string; className: string }
> = {
  external: {
    label: "External",
    className: "rp-status-badge",
  },
  internal_candidate: {
    label: "Internal Candidate",
    className: "rp-priority-badge",
  },
  trick_internal: {
    label: "Trick Internal",
    className: "rp-candidate-trick-internal",
  },
};

type AutomationInsight = {
  id: string;
  title: string;
  description: string;
  severity: "success" | "warning" | "info" | "neutral";
  icon: "alert" | "check" | "clock" | "file" | "pause" | "user" | "zap";
};

function applyCandidateOverride(
  candidate: CandidateMini,
  overrides: CandidateOverrides
): CandidateMini {
  const override = overrides[candidate.id];

  if (!override) {
    return candidate;
  }

  return {
    ...candidate,
    ...override,
  };
}

function applyPositionOverride(
  position: PositionCardType,
  overrides: PositionOverrides
): PositionCardType {
  const override = overrides[position.id];

  if (!override) {
    return position;
  }

  return {
    ...position,
    ...override,
  };
}

function applyProjectOverride(
  project: ProjectColumnType,
  overrides: ProjectOverrides
): ProjectColumnType {
  const override = overrides[project.id];

  if (!override) {
    return project;
  }

  return {
    ...project,
    ...override,
  };
}

function getNextProcessStatus(
  currentStatus: CandidateProcessStatus
): CandidateProcessStatus {
  if (currentStatus === "rejected") return "screening";
  if (currentStatus === "stand_by") return "screening";

  const currentIndex = processStatusOrder.indexOf(currentStatus);

  if (currentIndex < 0) {
    return "screening";
  }

  return processStatusOrder[
    Math.min(currentIndex + 1, processStatusOrder.length - 1)
  ];
}

function getNextPositionStatus(
  currentStatus: PositionCardType["status"]
): PositionCardType["status"] {
  if (currentStatus === "open") return "on_hold";
  if (currentStatus === "on_hold") return "open";

  return currentStatus;
}

function getNextProjectPriority(
  currentPriority: ProjectPriority
): ProjectPriority {
  if (currentPriority === "high") return "medium";
  if (currentPriority === "medium") return "low";

  return "high";
}

function getAutomationInsights(candidate: CandidateMini): AutomationInsight[] {
  const insights: AutomationInsight[] = [];

  if (
    typeof candidate.daysInProcess === "number" &&
    candidate.daysInProcess >= 14 &&
    candidate.processStatus !== "hired" &&
    candidate.processStatus !== "rejected"
  ) {
    insights.push({
      id: "aging-alert",
      title: "Aging alert",
      description: `This candidate has been in process for ${candidate.daysInProcess} days. Consider reviewing next action or follow-up.`,
      severity: "warning",
      icon: "alert",
    });
  }

  if (candidate.resumeStatus === "none") {
    insights.push({
      id: "resume-missing",
      title: "Resume missing",
      description:
        "No internal resume is currently attached or marked as ready. Candidate should not be presented yet.",
      severity: "neutral",
      icon: "file",
    });
  }

  if (candidate.resumeStatus === "wip_resume") {
    insights.push({
      id: "resume-wip",
      title: "Resume in progress",
      description:
        "Internal resume is being prepared. Presentation should wait until resume is marked as ready.",
      severity: "info",
      icon: "clock",
    });
  }

  if (
    candidate.resumeStatus === "resume_ready" &&
    candidate.processStatus !== "hired" &&
    candidate.processStatus !== "rejected"
  ) {
    insights.push({
      id: "ready-to-present",
      title: "Ready to present",
      description:
        "Resume is ready and candidate can be considered for client presentation or next process step.",
      severity: "success",
      icon: "check",
    });
  }

  if (candidate.processStatus === "stand_by") {
    insights.push({
      id: "stand-by",
      title: "Process paused",
      description:
        "Candidate is currently on stand by. Aging should be treated differently while the position or process is paused.",
      severity: "warning",
      icon: "pause",
    });
  }

  if (
    candidate.processStatus === "hired" ||
    candidate.talentType === "trick_internal"
  ) {
    insights.push({
      id: "trick-internal",
      title: "Moved to Trick Internal",
      description:
        "Candidate is hired or already marked as Trick Internal. Recruiting process metrics should remain preserved.",
      severity: "success",
      icon: "user",
    });
  }

  if (
    candidate.processStatus === "contacted" &&
    candidate.resumeStatus === "none"
  ) {
    insights.push({
      id: "early-stage",
      title: "Early-stage candidate",
      description:
        "Candidate was contacted but has not moved to screening or resume preparation yet.",
      severity: "info",
      icon: "zap",
    });
  }

  return insights;
}

function AutomationIcon({ icon }: { icon: AutomationInsight["icon"] }) {
  if (icon === "alert") return <AlertTriangle className="h-4 w-4" />;
  if (icon === "check") return <CheckCircle2 className="h-4 w-4" />;
  if (icon === "clock") return <Clock3 className="h-4 w-4" />;
  if (icon === "file") return <FileText className="h-4 w-4" />;
  if (icon === "pause") return <PauseCircle className="h-4 w-4" />;
  if (icon === "user") return <UserCheck className="h-4 w-4" />;

  return <Zap className="h-4 w-4" />;
}

function automationInsightClassName(severity: AutomationInsight["severity"]) {
  if (severity === "success") {
    return "border-emerald-400 bg-emerald-100 text-zinc-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100";
  }

  if (severity === "warning") {
    return "border-amber-400 bg-amber-100 text-zinc-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100";
  }

  if (severity === "info") {
    return "border-blue-400 bg-blue-100 text-zinc-950 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100";
  }

  return "border-zinc-300 bg-zinc-100 text-zinc-950 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100";
}

function buildActivityStorageKey({
  mode,
  project,
  position,
  candidate,
}: {
  mode: "project" | "position" | "candidate";
  project: ProjectColumnType;
  position: PositionCardType | null;
  candidate: CandidateMini | null;
}) {
  if (mode === "candidate" && position && candidate) {
    return `rp-activity:project:${project.id}:position:${position.id}:candidate:${candidate.id}`;
  }

  if (mode === "position" && position) {
    return `rp-activity:project:${project.id}:position:${position.id}`;
  }

  return `rp-activity:project:${project.id}`;
}

function readStoredActivities(storageKey: string): LocalActivity[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((item) => {
      return (
        item &&
        typeof item.id === "string" &&
        typeof item.initials === "string" &&
        typeof item.text === "string" &&
        typeof item.meta === "string" &&
        (item.type === "comment" ||
          item.type === "activity" ||
          item.type === "action")
      );
    });
  } catch {
    return [];
  }
}

function writeStoredActivities(storageKey: string, activities: LocalActivity[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(activities));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }
}

function formatRelativeTime(isoDate: string) {
  const timestamp = new Date(isoDate).getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const minutes = Math.floor((Date.now() - timestamp) / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  return new Date(timestamp).toLocaleDateString("es-AR");
}

function normalizeMention(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function renderTextWithMentions(text: string): ReactNode[] {
  return text.split(/(@[A-Za-zÀ-ÿ0-9._-]+)/g).map((part, index) => {
    if (part.startsWith("@") && part.length > 1) {
      const isMe = normalizeMention(part).startsWith("@german");

      return (
        <span
          key={index}
          className={isMe ? "rp-mention rp-mention-me" : "rp-mention"}
        >
          {part}
        </span>
      );
    }

    return part;
  });
}

function buildBaseActivities(
  mode: "project" | "position" | "candidate",
  project: ProjectColumnType,
  position: PositionCardType | null,
  candidate: CandidateMini | null
): LocalActivity[] {
  return [
    {
      id: "base-activity-1",
      initials: "GA",
      text:
        mode === "candidate" && candidate && position
          ? `Germán added ${candidate.name} to ${position.title}.`
          : mode === "position" && position
            ? `Germán added ${position.title} to ${project.projectName}.`
            : `Germán added ${project.projectName} to Resource Planning.`,
      meta: "Initial activity · mock",
      type: "activity",
    },
    {
      id: "base-activity-2",
      initials: "AJ",
      text:
        mode === "candidate"
          ? "Ana updated candidate status."
          : mode === "position"
            ? "Ana reviewed candidate allocation for this role."
            : "Ana updated project recruiting priorities.",
      meta: "Activity preview · mock",
      type: "activity",
    },
  ];
}

type QuickActionOption = {
  id: QuickActionId;
  label: string;
};

function getQuickActionOptions(
  mode: "project" | "position" | "candidate",
  candidate: CandidateMini | null,
  position: PositionCardType | null
): QuickActionOption[] {
  if (mode === "candidate" && candidate) {
    return [
      { id: "change_candidate_status", label: "Change candidate status" },
      { id: "assign_recruiter", label: "Assign recruiter" },
      { id: "mark_resume_ready", label: "Mark resume ready" },
      { id: "move_to_trick_internal", label: "Move to Trick Internal" },
    ];
  }

  if (mode === "position" && position) {
    return [
      { id: "change_position_status", label: "Change position status" },
      { id: "assign_internal_member", label: "Assign internal member" },
      { id: "request_more_candidates", label: "Request more candidates" },
      { id: "mark_jd_reviewed", label: "Mark JD as reviewed" },
    ];
  }

  return [
    { id: "update_project_priority", label: "Update project priority" },
    { id: "add_project_member", label: "Add project member" },
    { id: "mark_as_confidential", label: "Mark as confidential" },
    { id: "request_client_follow_up", label: "Request client follow-up" },
    { id: "archive_project", label: "Archive project" },
  ];
}

type ChipTone = "violet" | "green" | "blue" | "amber" | "red" | "gray";

const projectStatusTone: Record<ProjectStatus, ChipTone> = {
  active_search: "violet",
  active_no_search: "gray",
  coming_soon: "amber",
  inactive: "red",
};

const positionStatusTone: Record<PositionCardType["status"], ChipTone> = {
  open: "violet",
  hired: "green",
  on_hold: "amber",
  cancelled: "red",
};

const priorityTone: Record<ProjectPriority, ChipTone> = {
  high: "red",
  medium: "amber",
  low: "gray",
};

const priorityLabel: Record<ProjectPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const OWNER_OPTIONS = ["Ana", "Germán", "Sofía"];

const SMALL_BUTTON_CLASS =
  "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]";

type ResourceLink = {
  id: string;
  title: string;
  url: string;
};

type ResourceFile = {
  id: string;
  name: string;
  size: number;
};

type ProjectInfo = {
  owner: string;
  links: ResourceLink[];
  files: ResourceFile[];
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function useStoredState<T>(storageKey: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const rawValue = window.localStorage.getItem(storageKey);

      setValue(rawValue ? (JSON.parse(rawValue) as T) : initialValue);
    } catch {
      setValue(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const updateValue = (nextValue: T) => {
    setValue(nextValue);

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  };

  return [value, updateValue] as const;
}

function getPositionStats(position: PositionCardType) {
  const total = position.candidates.length;
  const quantity = position.quantity ?? 1;
  const hired = position.candidates.filter(
    (candidate) =>
      candidate.processStatus === "hired" ||
      candidate.talentType === "trick_internal"
  ).length;
  const ready = position.candidates.filter(
    (candidate) =>
      candidate.resumeStatus === "resume_ready" &&
      candidate.processStatus !== "hired" &&
      candidate.processStatus !== "rejected"
  ).length;

  return { total, quantity, hired, ready };
}

function getProjectInsights(project: ProjectColumnType): AutomationInsight[] {
  const insights: AutomationInsight[] = [];
  const openPositions = project.positions.filter(
    (position) => position.status === "open"
  );
  const onHoldPositions = project.positions.filter(
    (position) => position.status === "on_hold"
  );
  const totalCandidates = project.positions.reduce(
    (acc, position) => acc + position.candidates.length,
    0
  );
  const readyCandidates = project.positions.reduce(
    (acc, position) => acc + getPositionStats(position).ready,
    0
  );

  if (onHoldPositions.length > 0) {
    insights.push({
      id: "positions-on-hold",
      title: onHoldPositions.length === 1 ? "Position on hold" : "Positions on hold",
      description:
        onHoldPositions.length === 1
          ? `${onHoldPositions[0].title} · ${onHoldPositions[0].seniority} is on hold. Review it with the client.`
          : `${onHoldPositions.length} positions are on hold. Review them with the client.`,
      severity: "warning",
      icon: "pause",
    });
  }

  if (openPositions.length === 0 && project.status === "active_search") {
    insights.push({
      id: "no-open-positions",
      title: "No open positions",
      description:
        "This project is marked as active search but has no open positions. Consider updating its status.",
      severity: "warning",
      icon: "alert",
    });
  }

  if (openPositions.length === 0 && project.status === "active_no_search") {
    insights.push({
      id: "ready-to-archive",
      title: "Ready to archive",
      description:
        "There are no open searches. You can archive this project and keep its history.",
      severity: "info",
      icon: "file",
    });
  }

  if (openPositions.length > 0) {
    insights.push({
      id: "pipeline",
      title: "Pipeline",
      description: `${plural(totalCandidates, "candidate", "candidates")} linked to ${plural(
        openPositions.length,
        "open position",
        "open positions"
      )}, ${readyCandidates} ready to present.`,
      severity: readyCandidates > 0 ? "success" : "info",
      icon: readyCandidates > 0 ? "check" : "user",
    });
  }

  return insights;
}

function getPositionInsights(position: PositionCardType): AutomationInsight[] {
  const insights: AutomationInsight[] = [];
  const { total, quantity, hired, ready } = getPositionStats(position);

  if (position.status === "on_hold") {
    insights.push({
      id: "position-on-hold",
      title: "Position on hold",
      description:
        "Aging should be treated differently while this position is paused.",
      severity: "warning",
      icon: "pause",
    });
  }

  if (position.status === "cancelled") {
    insights.push({
      id: "position-cancelled",
      title: "Position cancelled",
      description: "This position was cancelled and no longer accepts candidates.",
      severity: "neutral",
      icon: "alert",
    });
  }

  if (hired > 0) {
    insights.push({
      id: "position-hired",
      title: hired === 1 ? "Candidate hired" : "Candidates hired",
      description: `${hired} of ${quantity} requested openings are covered.`,
      severity: "success",
      icon: "user",
    });
  }

  if (position.status === "open" && total === 0) {
    insights.push({
      id: "no-candidates",
      title: "No candidates yet",
      description:
        "Add candidates or request more profiles to start the process.",
      severity: "warning",
      icon: "alert",
    });
  }

  if (position.status === "open" && ready > 0) {
    insights.push({
      id: "ready-to-present",
      title: "Ready to present",
      description: `${plural(
        ready,
        "candidate has",
        "candidates have"
      )} a resume ready and can go to client review.`,
      severity: "success",
      icon: "check",
    });
  }

  if (position.status === "open" && total > 0 && ready === 0) {
    insights.push({
      id: "in-process",
      title: "In process",
      description: `${plural(total, "candidate", "candidates")} in process, none ready to present yet.`,
      severity: "info",
      icon: "clock",
    });
  }

  return insights;
}

export function ResourcePlanningDetailModal({
  project,
  initialPosition = null,
  initialCandidate = null,
  onClose,
  onCandidateUpdate,
  onPositionUpdate,
  onProjectUpdate,
  onProjectArchive,
  onAddPosition,
  onAddCandidate,
}: Props) {
  const [selectedPosition, setSelectedPosition] =
    useState<PositionCardType | null>(initialPosition);

  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateMini | null>(initialCandidate);

  const [candidateOverrides, setCandidateOverrides] =
    useState<CandidateOverrides>({});

  const [positionOverrides, setPositionOverrides] =
    useState<PositionOverrides>({});

  const [projectOverrides, setProjectOverrides] =
    useState<ProjectOverrides>({});

  useEffect(() => {
    setSelectedPosition(initialPosition);
    setSelectedCandidate(initialCandidate);
  }, [initialPosition, initialCandidate, project.id]);

  const effectiveProject = applyProjectOverride(project, projectOverrides);

  const livePosition = selectedPosition
    ? (project.positions.find((position) => position.id === selectedPosition.id) ??
      selectedPosition)
    : null;

  const liveCandidate = selectedCandidate
    ? ((livePosition ?? selectedPosition)?.candidates.find(
        (candidate) => candidate.id === selectedCandidate.id
      ) ?? selectedCandidate)
    : null;

  const effectiveSelectedPosition = livePosition
    ? applyPositionOverride(livePosition, positionOverrides)
    : null;

  const effectiveSelectedCandidate = liveCandidate
    ? applyCandidateOverride(liveCandidate, candidateOverrides)
    : null;

  const isCandidateView = Boolean(effectiveSelectedCandidate);
  const isPositionView =
    Boolean(effectiveSelectedPosition) && !effectiveSelectedCandidate;
  const isProjectView = !effectiveSelectedPosition && !effectiveSelectedCandidate;

  const projectConfig = projectStatusConfig[effectiveProject.status];

  const currentBarClass = effectiveSelectedPosition
    ? positionStatusConfig[effectiveSelectedPosition.status].barClass
    : projectConfig.barClass;

  const candidateNavigation = useMemo(() => {
    if (!effectiveSelectedPosition || !selectedCandidate) {
      return {
        currentIndex: -1,
        total: effectiveSelectedPosition?.candidates.length || 0,
        previousCandidate: null,
        nextCandidate: null,
      };
    }

    const currentIndex = effectiveSelectedPosition.candidates.findIndex(
      (candidate) => candidate.id === selectedCandidate.id
    );

    const previousCandidate =
      currentIndex > 0
        ? effectiveSelectedPosition.candidates[currentIndex - 1]
        : null;

    const nextCandidate =
      currentIndex >= 0 &&
      currentIndex < effectiveSelectedPosition.candidates.length - 1
        ? effectiveSelectedPosition.candidates[currentIndex + 1]
        : null;

    return {
      currentIndex,
      total: effectiveSelectedPosition.candidates.length,
      previousCandidate,
      nextCandidate,
    };
  }, [effectiveSelectedPosition, selectedCandidate]);

  const updateCandidateOverride = (
    candidateId: string,
    override: CandidateOverride
  ) => {
    setCandidateOverrides((currentOverrides) => ({
      ...currentOverrides,
      [candidateId]: {
        ...currentOverrides[candidateId],
        ...override,
      },
    }));

    onCandidateUpdate?.(candidateId, override);
  };

  const updatePositionOverride = (
    positionId: string,
    override: PositionOverride
  ) => {
    setPositionOverrides((currentOverrides) => ({
      ...currentOverrides,
      [positionId]: {
        ...currentOverrides[positionId],
        ...override,
      },
    }));

    onPositionUpdate?.(positionId, override);
  };

  const updateProjectOverride = (
    projectId: string,
    override: ProjectOverride
  ) => {
    setProjectOverrides((currentOverrides) => ({
      ...currentOverrides,
      [projectId]: {
        ...currentOverrides[projectId],
        ...override,
      },
    }));

    onProjectUpdate?.(projectId, override);
  };

  const handleQuickAction = (actionId: QuickActionId): QuickActionResult => {
    if (actionId === "mention_user") {
      return {
        activityText: "Mentioned a teammate.",
      };
    }

    if (actionId === "change_position_status" && effectiveSelectedPosition) {
      const nextStatus = getNextPositionStatus(effectiveSelectedPosition.status);

      updatePositionOverride(effectiveSelectedPosition.id, {
        status: nextStatus,
      });

      return {
        activityText:
          nextStatus === effectiveSelectedPosition.status
            ? `Position status remains ${
                positionStatusConfig[nextStatus].label
              }.`
            : `Changed position status to ${
                positionStatusConfig[nextStatus].label
              }.`,
        nextPosition: {
          ...effectiveSelectedPosition,
          status: nextStatus,
        },
      };
    }

    if (actionId === "assign_internal_member" && effectiveSelectedPosition) {
      updatePositionOverride(effectiveSelectedPosition.id, {
        owner: "Germán",
      });

      return {
        activityText: "Assigned internal owner to Germán.",
        nextPosition: {
          ...effectiveSelectedPosition,
          owner: "Germán",
        },
      };
    }

    if (actionId === "request_more_candidates" && effectiveSelectedPosition) {
      return {
        activityText: `Requested more candidates for ${effectiveSelectedPosition.title}.`,
      };
    }

    if (actionId === "mark_jd_reviewed" && effectiveSelectedPosition) {
      return {
        activityText: `Marked JD as reviewed for ${effectiveSelectedPosition.title}.`,
      };
    }

    if (actionId === "update_project_priority") {
      const nextPriority = getNextProjectPriority(effectiveProject.priority);

      updateProjectOverride(effectiveProject.id, {
        priority: nextPriority,
      });

      return {
        activityText: `Updated project priority to ${nextPriority}.`,
        nextProject: {
          ...effectiveProject,
          priority: nextPriority,
        },
      };
    }

    if (actionId === "mark_as_confidential") {
      const nextConfidential = !effectiveProject.confidential;

      updateProjectOverride(effectiveProject.id, {
        confidential: nextConfidential,
      });

      return {
        activityText: nextConfidential
          ? "Marked project as confidential."
          : "Marked project as public.",
        nextProject: {
          ...effectiveProject,
          confidential: nextConfidential,
        },
      };
    }

    if (actionId === "add_project_member") {
      return {
        activityText: "Added project member locally.",
      };
    }

    if (actionId === "request_client_follow_up") {
      return {
        activityText: "Requested client follow-up.",
      };
    }

    if (actionId === "archive_project") {
      if (effectiveProject.status !== "active_no_search") {
        return {
          activityText:
            "Archive skipped: the project still has open searches.",
        };
      }

      onProjectArchive?.(effectiveProject.id);

      return {
        activityText: "Archived project.",
      };
    }

    if (!effectiveSelectedCandidate) {
      return {
        activityText: "Quick action executed locally.",
      };
    }

    const candidateId = effectiveSelectedCandidate.id;

    if (actionId === "change_candidate_status") {
      const nextStatus = getNextProcessStatus(
        effectiveSelectedCandidate.processStatus
      );

      updateCandidateOverride(candidateId, {
        processStatus: nextStatus,
      });

      return {
        activityText: `Changed candidate status to ${
          processStatusConfig[nextStatus].label
        }.`,
        nextCandidate: {
          ...effectiveSelectedCandidate,
          processStatus: nextStatus,
        },
      };
    }

    if (actionId === "assign_recruiter") {
      updateCandidateOverride(candidateId, {
        recruiterOwner: "Germán",
      });

      return {
        activityText: "Assigned recruiter owner to Germán.",
        nextCandidate: {
          ...effectiveSelectedCandidate,
          recruiterOwner: "Germán",
        },
      };
    }

    if (actionId === "mark_resume_ready") {
      updateCandidateOverride(candidateId, {
        resumeStatus: "resume_ready",
      });

      return {
        activityText: "Marked resume as ready.",
        nextCandidate: {
          ...effectiveSelectedCandidate,
          resumeStatus: "resume_ready",
        },
      };
    }

    if (actionId === "move_to_trick_internal") {
      updateCandidateOverride(candidateId, {
        talentType: "trick_internal",
        processStatus: "hired",
      });

      return {
        activityText: "Moved candidate to Trick Internal and marked as hired.",
        nextCandidate: {
          ...effectiveSelectedCandidate,
          talentType: "trick_internal",
          processStatus: "hired",
        },
      };
    }

    return {
      activityText: "Quick action executed locally.",
    };
  };

  const mode: "project" | "position" | "candidate" = isCandidateView
    ? "candidate"
    : isPositionView
      ? "position"
      : "project";

  const [localActivities, setLocalActivities] = useState<LocalActivity[]>([]);

  const activityStorageKey = useMemo(() => {
    return buildActivityStorageKey({
      mode,
      project: effectiveProject,
      position: effectiveSelectedPosition,
      candidate: effectiveSelectedCandidate,
    });
  }, [mode, project.id, effectiveSelectedPosition?.id, effectiveSelectedCandidate?.id]);

  useEffect(() => {
    setLocalActivities(readStoredActivities(activityStorageKey));
  }, [activityStorageKey]);

  const contextLabel =
    mode === "candidate" && effectiveSelectedCandidate && effectiveSelectedPosition
      ? `${effectiveSelectedCandidate.name} · ${effectiveSelectedPosition.title}`
      : mode === "position" && effectiveSelectedPosition
        ? `${effectiveSelectedPosition.title} · ${effectiveProject.projectName}`
        : `${effectiveProject.projectName}`;

  const commitActivities = (nextActivities: LocalActivity[]) => {
    setLocalActivities(nextActivities);
    writeStoredActivities(activityStorageKey, nextActivities);
  };

  const addActivity = (text: string, type: LocalActivity["type"]) => {
    const nextActivity: LocalActivity = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      initials: "GA",
      author: "Germán",
      text,
      createdAt: new Date().toISOString(),
      meta:
        type === "comment"
          ? `Comment · Just now · ${contextLabel}`
          : `Action · Just now · ${contextLabel}`,
      type,
    };

    commitActivities([nextActivity, ...localActivities]);
  };

  const deleteActivity = (activityId: string) => {
    commitActivities(
      localActivities.filter((activity) => activity.id !== activityId)
    );
  };

  const toggleReaction = (activityId: string) => {
    commitActivities(
      localActivities.map((activity) => {
        if (activity.id !== activityId) {
          return activity;
        }

        if (!activity.reaction) {
          return {
            ...activity,
            reaction: { emoji: "👍", count: 1, reacted: true },
          };
        }

        const reacted = !activity.reaction.reacted;
        const count = Math.max(0, activity.reaction.count + (reacted ? 1 : -1));

        return {
          ...activity,
          reaction: count === 0 ? undefined : { ...activity.reaction, reacted, count },
        };
      })
    );
  };

  const handleQuickActionClick = (actionId: QuickActionId) => {
    const result = handleQuickAction(actionId);

    addActivity(result.activityText, "action");

    if (result.nextCandidate) {
      setSelectedCandidate(result.nextCandidate);
    }

    if (result.nextPosition) {
      setSelectedPosition(result.nextPosition);
    }
  };

  const handleCopyLink = () => {
    try {
      void navigator.clipboard.writeText(window.location.href);
    } catch {
      // Clipboard can be unavailable in some browsers or contexts.
    }
  };

  const handleProjectChange = (updates: ProjectOverride, activityText: string) => {
    updateProjectOverride(effectiveProject.id, updates);
    addActivity(activityText, "action");
  };

  const handlePositionChange = (updates: PositionOverride, activityText: string) => {
    if (!effectiveSelectedPosition) {
      return;
    }

    updatePositionOverride(effectiveSelectedPosition.id, updates);
    addActivity(activityText, "action");
  };

  const positionIndex = effectiveSelectedPosition
    ? effectiveProject.positions.findIndex(
        (position) => position.id === effectiveSelectedPosition.id
      )
    : -1;

  const previousPosition =
    positionIndex > 0 ? effectiveProject.positions[positionIndex - 1] : null;

  const nextPosition =
    positionIndex >= 0 && positionIndex < effectiveProject.positions.length - 1
      ? effectiveProject.positions[positionIndex + 1]
      : null;

  const quickActionOptions = getQuickActionOptions(
    mode,
    effectiveSelectedCandidate,
    effectiveSelectedPosition
  );

  const visibleActivities = [
    ...localActivities,
    ...buildBaseActivities(
      mode,
      effectiveProject,
      effectiveSelectedPosition,
      effectiveSelectedCandidate
    ),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <article
        className="relative flex w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border shadow-2xl app-border app-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`h-1.5 ${currentBarClass}`} />

        <RpDetailStyles />

        <header className="border-b px-6 py-5 app-border">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Breadcrumbs
                project={effectiveProject}
                selectedPosition={effectiveSelectedPosition}
                selectedCandidate={effectiveSelectedCandidate}
              />

              {isCandidateView &&
              effectiveSelectedCandidate &&
              effectiveSelectedPosition ? (
                <>
                  <NavigationControls
                    level="candidate"
                    showPager={false}
                    candidateCurrentIndex={candidateNavigation.currentIndex}
                    candidateTotal={candidateNavigation.total}
                    hasPreviousCandidate={Boolean(
                      candidateNavigation.previousCandidate
                    )}
                    hasNextCandidate={Boolean(candidateNavigation.nextCandidate)}
                    onUp={() => setSelectedCandidate(null)}
                    onPreviousCandidate={() => {
                      if (candidateNavigation.previousCandidate) {
                        setSelectedCandidate(
                          candidateNavigation.previousCandidate
                        );
                      }
                    }}
                    onNextCandidate={() => {
                      if (candidateNavigation.nextCandidate) {
                        setSelectedCandidate(candidateNavigation.nextCandidate);
                      }
                    }}
                  />

                  <h2 className="text-2xl font-semibold app-text-primary">
                    {effectiveSelectedCandidate.name} -{" "}
                    {effectiveSelectedPosition.title} /{" "}
                    {effectiveSelectedPosition.seniority}
                  </h2>

                  <p className="mt-1 text-sm app-text-secondary">
                    {effectiveSelectedCandidate.location} · Candidate ID:{" "}
                    {effectiveSelectedCandidate.id}
                  </p>
                </>
              ) : isPositionView && effectiveSelectedPosition ? (
                <>
                  <NavigationControls
                    level="position"
                    onUp={() => setSelectedPosition(null)}
                  />

                  <h2 className="text-2xl font-semibold app-text-primary">
                    {effectiveSelectedPosition.title}
                  </h2>

                  <p className="mt-1 text-sm app-text-secondary">
                    {effectiveSelectedPosition.seniority} ·{" "}
                    {effectiveProject.clientName} · {effectiveProject.projectName}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold app-text-primary">
                    {effectiveProject.projectName}
                  </h2>

                  <p className="mt-1 text-sm app-text-secondary">
                    {effectiveProject.clientName} · Project detail
                  </p>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isCandidateView &&
                effectiveSelectedCandidate &&
                effectiveSelectedPosition && (
                  <CandidatePager
                    currentIndex={candidateNavigation.currentIndex}
                    total={candidateNavigation.total}
                    hasPrevious={Boolean(candidateNavigation.previousCandidate)}
                    hasNext={Boolean(candidateNavigation.nextCandidate)}
                    onPrevious={() => {
                      if (candidateNavigation.previousCandidate) {
                        setSelectedCandidate(candidateNavigation.previousCandidate);
                      }
                    }}
                    onNext={() => {
                      if (candidateNavigation.nextCandidate) {
                        setSelectedCandidate(candidateNavigation.nextCandidate);
                      }
                    }}
                  />
                )}

              {isPositionView && effectiveSelectedPosition && (
                <CandidatePager
                  entityLabel="position"
                  currentIndex={positionIndex}
                  total={effectiveProject.positions.length}
                  hasPrevious={Boolean(previousPosition)}
                  hasNext={Boolean(nextPosition)}
                  onPrevious={() => {
                    if (previousPosition) {
                      setSelectedPosition(previousPosition);
                    }
                  }}
                  onNext={() => {
                    if (nextPosition) {
                      setSelectedPosition(nextPosition);
                    }
                  }}
                />
              )}

              <button
                className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                aria-label="Attachments"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {isCandidateView && (
                <button
                  onClick={handleCopyLink}
                  className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  aria-label="Copy link"
                  title="Copy link"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
              )}

              <QuickActionsMenu
                options={quickActionOptions}
                onAction={handleQuickActionClick}
              />

              <button
                onClick={onClose}
                className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isCandidateView && effectiveSelectedCandidate && (
            <CandidateHeaderSummary candidate={effectiveSelectedCandidate} />
          )}

          {isPositionView && effectiveSelectedPosition && (
            <PositionHeaderSummary
              project={effectiveProject}
              position={effectiveSelectedPosition}
            />
          )}

          {isProjectView && <ProjectHeaderSummary project={effectiveProject} />}
        </header>

        <div className="grid h-[78vh] min-h-[620px] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)]">
          <main className="h-full overflow-y-auto px-6 py-5">
            {isProjectView && (
              <ProjectDetailContent
                project={effectiveProject}
                onPositionClick={setSelectedPosition}
                onProjectChange={handleProjectChange}
                onLogActivity={(text) => addActivity(text, "action")}
                onArchive={() => handleQuickActionClick("archive_project")}
                onAddPosition={() => onAddPosition?.(effectiveProject)}
              />
            )}

            {isPositionView && effectiveSelectedPosition && (
              <PositionDetailContent
                project={effectiveProject}
                position={effectiveSelectedPosition}
                onCandidateClick={setSelectedCandidate}
                onPositionChange={handlePositionChange}
                onLogActivity={(text) => addActivity(text, "action")}
                onAddCandidate={() =>
                  onAddCandidate?.(effectiveProject, effectiveSelectedPosition)
                }
              />
            )}

            {isCandidateView &&
              effectiveSelectedCandidate &&
              effectiveSelectedPosition && (
                <CandidateDetailContent candidate={effectiveSelectedCandidate} />
              )}
          </main>

          <aside className="h-full min-h-0 overflow-hidden border-t app-border app-card lg:border-l lg:border-t-0">
            <CommentsActivityPanel
              activities={visibleActivities}
              onAddComment={(text) => addActivity(text, "comment")}
              onDeleteActivity={deleteActivity}
              onToggleReaction={toggleReaction}
            />
          </aside>
        </div>
      </article>
    </div>
  );
}

type BreadcrumbsProps = {
  project: ProjectColumnType;
  selectedPosition: PositionCardType | null;
  selectedCandidate: CandidateMini | null;
};

function Breadcrumbs({
  project,
  selectedPosition,
  selectedCandidate,
}: BreadcrumbsProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="rp-status-badge rounded-full px-2.5 py-1 text-xs font-semibold">
        Resource Planning
      </span>

      <span className="text-xs app-text-muted">/</span>

      <span className="rp-status-badge rounded-full px-2.5 py-1 text-xs font-semibold">
        {project.clientName}
      </span>

      {selectedPosition && (
        <>
          <span className="text-xs app-text-muted">/</span>

          <span
            className={`rp-board-badge rounded-full border px-2.5 py-1 text-xs font-semibold ${
              positionStatusConfig[selectedPosition.status].badgeClass
            }`}
          >
            {selectedPosition.title}
          </span>
        </>
      )}

      {selectedCandidate && (
        <>
          <span className="text-xs app-text-muted">/</span>

          <span className="rp-priority-badge rounded-full px-2.5 py-1 text-xs font-semibold">
            {selectedCandidate.name}
          </span>
        </>
      )}
    </div>
  );
}

type NavigationControlsProps = {
  level: "position" | "candidate";
  candidateCurrentIndex?: number;
  candidateTotal?: number;
  hasPreviousCandidate?: boolean;
  hasNextCandidate?: boolean;
  showPager?: boolean;
  onUp: () => void;
  onPreviousCandidate?: () => void;
  onNextCandidate?: () => void;
};

function NavigationControls({
  level,
  candidateCurrentIndex = -1,
  candidateTotal = 0,
  hasPreviousCandidate = false,
  hasNextCandidate = false,
  showPager = true,
  onUp,
  onPreviousCandidate,
  onNextCandidate,
}: NavigationControlsProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button
        onClick={onUp}
        className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      >
        <ArrowUp className="h-4 w-4" />
        {level === "candidate" ? "Volver a posición" : "Volver a proyecto"}
      </button>

      {level === "candidate" && showPager && (
        <>
          <button
            disabled={!hasPreviousCandidate}
            onClick={onPreviousCandidate}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition app-border app-text-secondary hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.06]"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>

          <button
            disabled={!hasNextCandidate}
            onClick={onNextCandidate}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition app-border app-text-secondary hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.06]"
          >
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </button>

          <span className="rounded-xl border px-3 py-2 text-sm app-border app-text-muted">
            {candidateCurrentIndex + 1} / {candidateTotal}
          </span>
        </>
      )}
    </div>
  );
}

function RpChip({ tone, children }: { tone: ChipTone; children: ReactNode }) {
  return <span className={`rp-chip rp-chip-${tone}`}>{children}</span>;
}

function InsightsGrid({
  insights,
  emptyText,
}: {
  insights: AutomationInsight[];
  emptyText: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-violet-500" />
        <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
          Automation insights
        </p>
      </div>

      <div className="grid gap-2.5 md:grid-cols-3">
        {insights.length > 0 ? (
          insights.map((insight) => (
            <div
              key={insight.id}
              className={`rp-detail-insight flex items-start gap-3 rounded-xl border px-3 py-2.5 ${automationInsightClassName(
                insight.severity
              )}`}
            >
              <div className="mt-0.5 shrink-0">
                <AutomationIcon icon={insight.icon} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold">{insight.title}</p>
                <p className="mt-0.5 text-xs leading-5">{insight.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed px-3 py-3 text-center text-sm app-border app-text-muted md:col-span-3">
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectHeaderSummary({ project }: { project: ProjectColumnType }) {
  const openPositions = project.positions.filter(
    (position) => position.status === "open"
  ).length;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:overflow-x-auto">
        <RpChip tone={projectStatusTone[project.status]}>
          <Search aria-hidden="true" />
          {projectStatusConfig[project.status].label}
        </RpChip>

        <RpChip tone={priorityTone[project.priority]}>
          <Flag aria-hidden="true" />
          {priorityLabel[project.priority]} priority
        </RpChip>

        {project.confidential ? (
          <RpChip tone="red">
            <Lock aria-hidden="true" />
            Confidential
          </RpChip>
        ) : (
          <RpChip tone="green">
            <Unlock aria-hidden="true" />
            Public
          </RpChip>
        )}

        <RpChip tone="blue">
          <BriefcaseBusiness aria-hidden="true" />
          {plural(openPositions, "open position", "open positions")}
        </RpChip>
      </div>

      <InsightsGrid
        insights={getProjectInsights(project)}
        emptyText="No automation insights for this project yet."
      />
    </div>
  );
}

function PositionHeaderSummary({
  project,
  position,
}: {
  project: ProjectColumnType;
  position: PositionCardType;
}) {
  const { quantity, hired } = getPositionStats(position);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:overflow-x-auto">
        <RpChip tone={positionStatusTone[position.status]}>
          <BriefcaseBusiness aria-hidden="true" />
          {positionStatusConfig[position.status].label}
        </RpChip>

        <RpChip tone={priorityTone[project.priority]}>
          <Flag aria-hidden="true" />
          {priorityLabel[project.priority]} priority
        </RpChip>

        {project.confidential ? (
          <RpChip tone="red">
            <Lock aria-hidden="true" />
            Confidential
          </RpChip>
        ) : (
          <RpChip tone="green">
            <Unlock aria-hidden="true" />
            Public
          </RpChip>
        )}

        <RpChip tone={hired >= quantity ? "green" : "amber"}>
          <Users aria-hidden="true" />
          {hired} / {quantity} hired
        </RpChip>
      </div>

      <InsightsGrid
        insights={getPositionInsights(position)}
        emptyText="No automation insights for this position yet."
      />
    </div>
  );
}

function SectionLabel({
  icon,
  action,
  children,
}: {
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
          {children}
        </p>
      </div>

      {action}
    </div>
  );
}

function FileAttachButton({
  label,
  onFiles,
}: {
  label: string;
  onFiles: (files: ResourceFile[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const pickedFiles = Array.from<File>(event.target.files ?? []).map((file) => ({
            id: makeId(),
            name: file.name,
            size: file.size,
          }));

          if (pickedFiles.length > 0) {
            onFiles(pickedFiles);
          }

          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={SMALL_BUTTON_CLASS}
      >
        <Paperclip className="h-3.5 w-3.5" />
        {label}
      </button>
    </>
  );
}

type ResourceRowProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  onRemove: () => void;
};

function ResourceRow({ icon, title, subtitle, href, onRemove }: ResourceRowProps) {
  return (
    <div className="flex items-center gap-3 border-t px-4 py-2.5 first:border-t-0 app-border">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm font-semibold app-text-primary hover:underline"
          >
            {title}
          </a>
        ) : (
          <p className="truncate text-sm font-semibold app-text-primary">{title}</p>
        )}

        <p className="truncate text-xs app-text-muted">{subtitle}</p>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${title}`}
        className="rounded-lg p-1.5 transition app-text-muted rp-row-hover"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

type RichTextEditorProps = {
  storageKey: string;
  initialText?: string;
  placeholder: string;
  ariaLabel: string;
};

function RichTextEditor({
  storageKey,
  initialText,
  placeholder,
  ariaLabel,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    let storedContent: string | null = null;

    try {
      storedContent = window.localStorage.getItem(storageKey);
    } catch {
      storedContent = null;
    }

    editor.innerHTML =
      storedContent ?? escapeHtml(initialText || "").replace(/\n/g, "<br>");
  }, [storageKey, initialText]);

  const persistContent = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, editor.innerHTML);
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  };

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command);
    persistContent();
  };

  const toolbarButtons = [
    { command: "bold", label: "Bold", icon: <Bold className="h-3.5 w-3.5" /> },
    { command: "italic", label: "Italic", icon: <Italic className="h-3.5 w-3.5" /> },
    { command: "underline", label: "Underline", icon: <Underline className="h-3.5 w-3.5" /> },
    { command: "insertUnorderedList", label: "Bulleted list", icon: <List className="h-3.5 w-3.5" /> },
    { command: "insertOrderedList", label: "Numbered list", icon: <ListOrdered className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="overflow-hidden rounded-xl border app-border app-card">
      <div className="flex gap-1 border-b px-3 py-2 app-border">
        {toolbarButtons.map((button) => (
          <button
            key={button.command}
            type="button"
            title={button.label}
            aria-label={button.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(button.command)}
            className="rounded-lg p-1.5 transition app-text-secondary hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
          >
            {button.icon}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        spellCheck={false}
        onInput={persistContent}
        className="rp-notes-editor min-h-[130px] px-4 py-3 text-sm leading-6 outline-none app-text-primary"
      />
    </div>
  );
}

type ProjectDetailContentProps = {
  project: ProjectColumnType;
  onPositionClick: (position: PositionCardType) => void;
  onProjectChange: (updates: ProjectOverride, activityText: string) => void;
  onLogActivity: (text: string) => void;
  onArchive: () => void;
  onAddPosition: () => void;
};

function ProjectDetailContent({
  project,
  onPositionClick,
  onProjectChange,
  onLogActivity,
  onArchive,
  onAddPosition,
}: ProjectDetailContentProps) {
  const [info, setInfo] = useStoredState<ProjectInfo>(
    `rp-project-info:${project.id}`,
    { owner: "", links: [], files: [] }
  );
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const links = info.links ?? [];
  const files = info.files ?? [];
  const canArchive = project.status === "active_no_search";

  const addLink = () => {
    const url = linkUrl.trim();

    if (!url) {
      return;
    }

    setInfo({
      ...info,
      links: [...links, { id: makeId(), title: linkTitle.trim() || url, url }],
    });
    onLogActivity("Added a project link.");
    setLinkTitle("");
    setLinkUrl("");
    setIsAddingLink(false);
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border app-border app-card">
        <div className="relative h-40 overflow-hidden">
          <img
            src={project.cover}
            alt={project.projectName}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          <button
            type="button"
            title="Available when the backend is connected"
            className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl border border-white/25 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Change cover
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-sm font-medium text-white/80">{project.clientName}</p>
            <h3 className="text-2xl font-semibold text-white">{project.projectName}</h3>
          </div>
        </div>

        <div className="p-4">
          <SectionLabel icon={<ShieldCheck className="h-3.5 w-3.5 app-text-muted" />}>
            Project brief
          </SectionLabel>

          <RichTextEditor
            storageKey={`rp-brief:project:${project.id}`}
            initialText={project.description}
            placeholder="Describe the project..."
            ariaLabel="Project brief"
          />
        </div>
      </section>

      <section>
        <SectionLabel>Project details</SectionLabel>

        <div className="overflow-hidden rounded-xl border app-border app-card">
          <PersonalInfoRow icon={<Search />} label="Status">
            <select
              className="rp-select"
              value={project.status}
              onChange={(event) => {
                const nextStatus = event.target.value as ProjectStatus;

                onProjectChange(
                  { status: nextStatus },
                  `Changed project status to ${projectStatusConfig[nextStatus].label}.`
                );
              }}
            >
              {(Object.keys(projectStatusConfig) as ProjectStatus[]).map((status) => (
                <option key={status} value={status}>
                  {projectStatusConfig[status].label}
                </option>
              ))}
            </select>
          </PersonalInfoRow>

          <PersonalInfoRow icon={<Flag />} label="Priority">
            <select
              className="rp-select"
              value={project.priority}
              onChange={(event) => {
                const nextPriority = event.target.value as ProjectPriority;

                onProjectChange(
                  { priority: nextPriority },
                  `Updated project priority to ${nextPriority}.`
                );
              }}
            >
              {(Object.keys(priorityLabel) as ProjectPriority[]).map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabel[priority]}
                </option>
              ))}
            </select>
          </PersonalInfoRow>

          <PersonalInfoRow icon={<Lock />} label="Visibility">
            <select
              className="rp-select"
              value={project.confidential ? "confidential" : "public"}
              onChange={(event) => {
                const nextConfidential = event.target.value === "confidential";

                onProjectChange(
                  { confidential: nextConfidential },
                  nextConfidential
                    ? "Marked project as confidential."
                    : "Marked project as public."
                );
              }}
            >
              <option value="confidential">Confidential</option>
              <option value="public">Public</option>
            </select>
          </PersonalInfoRow>

          <PersonalInfoRow icon={<UserRound />} label="Delivery owner">
            <select
              className="rp-select"
              value={info.owner ?? ""}
              onChange={(event) => {
                setInfo({ ...info, owner: event.target.value });

                if (event.target.value) {
                  onLogActivity(`Assigned delivery owner to ${event.target.value}.`);
                }
              }}
            >
              <option value="">Not assigned</option>
              {OWNER_OPTIONS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </PersonalInfoRow>

          <PersonalInfoRow icon={<BriefcaseBusiness />} label="Client">
            {project.clientName}
          </PersonalInfoRow>
        </div>
      </section>

      <section>
        <SectionLabel
          action={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsAddingLink((current) => !current)}
                className={SMALL_BUTTON_CLASS}
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Add link
              </button>

              <FileAttachButton
                label="Attach file"
                onFiles={(picked) => {
                  setInfo({ ...info, files: [...files, ...picked] });
                  onLogActivity(
                    `Attached ${plural(picked.length, "file", "files")} to the project.`
                  );
                }}
              />
            </div>
          }
        >
          Client &amp; project info
        </SectionLabel>

        <div className="overflow-hidden rounded-xl border app-border app-card">
          {isAddingLink && (
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3 app-border">
              <input
                value={linkTitle}
                onChange={(event) => setLinkTitle(event.target.value)}
                placeholder="Title (optional)"
                className="rp-select min-w-[140px] flex-1"
              />

              <input
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addLink();
                  }
                }}
                placeholder="https://..."
                className="rp-select min-w-[200px] flex-[2]"
              />

              <button
                type="button"
                onClick={addLink}
                disabled={!linkUrl.trim()}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add
              </button>

              <button
                type="button"
                onClick={() => setIsAddingLink(false)}
                className="rp-link-btn text-xs"
              >
                Cancel
              </button>
            </div>
          )}

          {links.length === 0 && files.length === 0 && !isAddingLink && (
            <p className="px-4 py-6 text-center text-sm app-text-muted">
              No links or files yet. Add the brief, NDA or any useful reference for the
              recruiting team.
            </p>
          )}

          {links.map((link) => (
            <ResourceRow
              key={link.id}
              icon={<LinkIcon className="h-4 w-4" />}
              title={link.title}
              subtitle={link.url}
              href={normalizeUrl(link.url)}
              onRemove={() => setInfo({ ...info, links: links.filter((item) => item.id !== link.id) })}
            />
          ))}

          {files.map((file) => (
            <ResourceRow
              key={file.id}
              icon={<FileText className="h-4 w-4" />}
              title={file.name}
              subtitle={formatFileSize(file.size)}
              onRemove={() => setInfo({ ...info, files: files.filter((item) => item.id !== file.id) })}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionLabel
          icon={<BriefcaseBusiness className="h-3.5 w-3.5 app-text-muted" />}
          action={
            <button
              type="button"
              onClick={onAddPosition}
              className={SMALL_BUTTON_CLASS}
            >
              <Plus className="h-3.5 w-3.5" />
              Add position
            </button>
          }
        >
          Positions ({project.positions.length})
        </SectionLabel>

        <div className="overflow-hidden rounded-xl border app-border app-card">
          {project.positions.length > 0 ? (
            project.positions.map((position) => {
              const positionConfig = positionStatusConfig[position.status];
              const stats = getPositionStats(position);

              return (
                <button
                  key={position.id}
                  type="button"
                  onClick={() => onPositionClick(position)}
                  className="rp-row-hover flex w-full items-center gap-4 border-t px-4 py-3 text-left first:border-t-0 app-border"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold app-text-primary">
                      {position.title} · {position.seniority}
                    </p>

                    <p className="mt-0.5 text-xs app-text-muted">
                      Owner {position.owner} ·{" "}
                      {plural(stats.total, "candidate", "candidates")}
                    </p>
                  </div>

                  <span
                    className={`rp-board-badge shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${positionConfig.badgeClass}`}
                  >
                    {positionConfig.label}
                  </span>

                  <span className="w-20 shrink-0 text-right text-xs app-text-secondary">
                    {stats.hired} / {stats.quantity} hired
                  </span>

                  <ChevronRight className="h-4 w-4 shrink-0 app-text-muted" />
                </button>
              );
            })
          ) : (
            <p className="px-4 py-6 text-center text-sm app-text-muted">
              No positions yet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-red-500/30 p-4 app-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
          Archive project
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm leading-6 app-text-secondary">
            {canArchive
              ? "This project has no open searches. You can archive it: it leaves the board but keeps its full history."
              : "Archive this project once it has no open searches (status: No open searches). It leaves the board but keeps its full history."}
          </p>

          <button
            type="button"
            onClick={onArchive}
            disabled={!canArchive}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Archive className="h-4 w-4" />
            Archive project
          </button>
        </div>
      </section>
    </div>
  );
}

type PositionDetailContentProps = {
  project: ProjectColumnType;
  position: PositionCardType;
  onCandidateClick: (candidate: CandidateMini) => void;
  onPositionChange: (updates: PositionOverride, activityText: string) => void;
  onLogActivity: (text: string) => void;
  onAddCandidate: () => void;
};

function PositionDetailContent({
  project,
  position,
  onCandidateClick,
  onPositionChange,
  onLogActivity,
  onAddCandidate,
}: PositionDetailContentProps) {
  const stats = getPositionStats(position);
  const jdKey = `rp-jd:project:${project.id}:position:${position.id}`;
  const [jdFiles, setJdFiles] = useStoredState<ResourceFile[]>(`${jdKey}:files`, []);

  const ownerOptions = OWNER_OPTIONS.includes(position.owner)
    ? OWNER_OPTIONS
    : [position.owner, ...OWNER_OPTIONS];

  return (
    <div className="space-y-5">
      <section>
        <SectionLabel
          icon={<FileText className="h-3.5 w-3.5 app-text-muted" />}
          action={
            <FileAttachButton
              label="Attach JD file"
              onFiles={(picked) => {
                setJdFiles([...jdFiles, ...picked]);
                onLogActivity(`Attached ${plural(picked.length, "JD file", "JD files")}.`);
              }}
            />
          }
        >
          Position brief / JD
        </SectionLabel>

        <RichTextEditor
          storageKey={jdKey}
          placeholder="Write or paste the JD or the client request..."
          ariaLabel="Position brief and JD"
        />

        {jdFiles.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-xl border app-border app-card">
            {jdFiles.map((file) => (
              <ResourceRow
                key={file.id}
                icon={<FileText className="h-4 w-4" />}
                title={file.name}
                subtitle={formatFileSize(file.size)}
                onRemove={() => setJdFiles(jdFiles.filter((item) => item.id !== file.id))}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionLabel>Position details</SectionLabel>

        <div className="overflow-hidden rounded-xl border app-border app-card">
          <PersonalInfoRow icon={<BriefcaseBusiness />} label="Status">
            <select
              className="rp-select"
              value={position.status}
              onChange={(event) => {
                const nextStatus = event.target.value as PositionCardType["status"];

                onPositionChange(
                  { status: nextStatus },
                  `Changed position status to ${positionStatusConfig[nextStatus].label}.`
                );
              }}
            >
              {(Object.keys(positionStatusConfig) as PositionCardType["status"][]).map(
                (status) => (
                  <option key={status} value={status}>
                    {positionStatusConfig[status].label}
                  </option>
                )
              )}
            </select>
          </PersonalInfoRow>

          <PersonalInfoRow icon={<UserRound />} label="Owner">
            <select
              className="rp-select"
              value={position.owner}
              onChange={(event) =>
                onPositionChange(
                  { owner: event.target.value },
                  `Assigned internal owner to ${event.target.value}.`
                )
              }
            >
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </PersonalInfoRow>

          <PersonalInfoRow icon={<Flag />} label="Seniority">
            {position.seniority}
          </PersonalInfoRow>

          <PersonalInfoRow icon={<Users />} label="Openings">
            {stats.hired} of {stats.quantity} filled
          </PersonalInfoRow>

          <PersonalInfoRow icon={<BriefcaseBusiness />} label="Client / Project">
            {project.clientName} · {project.projectName}
          </PersonalInfoRow>
        </div>
      </section>

      <section>
        <SectionLabel
          icon={<Users className="h-3.5 w-3.5 app-text-muted" />}
          action={
            <button
              type="button"
              onClick={onAddCandidate}
              className={SMALL_BUTTON_CLASS}
            >
              <Plus className="h-3.5 w-3.5" />
              Add candidate
            </button>
          }
        >
          Candidates assigned ({position.candidates.length})
        </SectionLabel>

        <div className="grid gap-3 md:grid-cols-2">
          {position.candidates.length > 0 ? (
            position.candidates.map((candidate) => (
              <CandidateMiniCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => onCandidateClick(candidate)}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed px-3 py-5 text-center text-sm app-border app-text-muted md:col-span-2">
              No candidates linked yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type CandidatePagerProps = {
  entityLabel?: string;
  currentIndex: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function CandidatePager({
  entityLabel = "candidate",
  currentIndex,
  total,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: CandidatePagerProps) {
  return (
    <div className="inline-flex items-center rounded-xl border app-border">
      <button
        onClick={onPrevious}
        disabled={!hasPrevious}
        aria-label={`Previous ${entityLabel}`}
        className="rounded-l-xl p-2 transition app-text-secondary hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.06]"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="px-2 text-sm font-semibold app-text-primary">
        {currentIndex + 1} / {total}
      </span>

      <button
        onClick={onNext}
        disabled={!hasNext}
        aria-label={`Next ${entityLabel}`}
        className="rounded-r-xl p-2 transition app-text-secondary hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/[0.06]"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

type QuickActionsMenuProps = {
  options: QuickActionOption[];
  onAction: (actionId: QuickActionId) => void;
};

function QuickActionsMenu({ options, onAction }: QuickActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rp-quick-btn"
      >
        <Zap className="h-4 w-4" />
        Quick Actions
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border p-1.5 shadow-xl app-border app-card"
        >
          {options.map((option) => (
            <button
              key={option.id}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onAction(option.id);
              }}
              className="rp-menu-item block w-full rounded-lg px-3 py-2 text-left text-sm font-medium app-text-primary"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RpDetailStyles() {
  return (
    <style>{`
      .rp-chip {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        white-space: nowrap;
        border-radius: 9999px;
        border: 1px solid;
        padding: 10px 20px;
        font-size: 15px;
        font-weight: 700;
        line-height: 1;
      }
      .rp-chip svg { width: 18px; height: 18px; flex-shrink: 0; }
      .rp-chip-violet { background: rgba(124,58,237,.10); border-color: rgba(124,58,237,.35); color: #6d28d9; }
      .rp-chip-green  { background: rgba(34,197,94,.12);  border-color: rgba(34,197,94,.40);  color: #15803d; }
      .rp-chip-blue   { background: rgba(59,130,246,.10); border-color: rgba(59,130,246,.35); color: #1d4ed8; }
      .rp-chip-amber  { background: rgba(245,158,11,.14); border-color: rgba(245,158,11,.40); color: #b45309; }
      .rp-chip-red    { background: rgba(239,68,68,.10);  border-color: rgba(239,68,68,.35);  color: #b91c1c; }
      .rp-chip-gray   { background: rgba(113,113,122,.12); border-color: rgba(113,113,122,.35); color: #52525b; }
      html[data-theme="dark"] .rp-chip-violet { background: rgba(124,58,237,.16); border-color: rgba(124,58,237,.35); color: #c4b5fd; }
      html[data-theme="dark"] .rp-chip-green  { background: rgba(34,197,94,.14);  border-color: rgba(34,197,94,.35);  color: #86efac; }
      html[data-theme="dark"] .rp-chip-blue   { background: rgba(59,130,246,.14); border-color: rgba(59,130,246,.35); color: #93c5fd; }
      html[data-theme="dark"] .rp-chip-amber  { background: rgba(245,158,11,.14); border-color: rgba(245,158,11,.35); color: #fcd34d; }
      html[data-theme="dark"] .rp-chip-red    { background: rgba(239,68,68,.14);  border-color: rgba(239,68,68,.35);  color: #fca5a5; }
      html[data-theme="dark"] .rp-chip-gray   { background: rgba(161,161,170,.12); border-color: rgba(161,161,170,.30); color: #d4d4d8; }

      html:not([data-theme="dark"]) .rp-detail-insight,
      html:not([data-theme="dark"]) .rp-detail-insight * {
        color: #09090b !important;
        opacity: 1 !important;
      }
      html:not([data-theme="dark"]) .rp-detail-insight svg {
        color: #09090b !important;
        stroke: currentColor !important;
      }

      .rp-quick-btn {
        display: inline-flex; align-items: center; gap: 8px;
        border-radius: 12px; background: #7c3aed; color: #ffffff;
        padding: 8px 16px; font-size: 14px; font-weight: 600; transition: background .15s;
      }
      .rp-quick-btn:hover { background: #6d28d9; }
      .rp-menu-item:hover { background: var(--app-surface-muted); }

      .rp-mention {
        display: inline-block; border-radius: 6px; padding: 0 6px;
        background: var(--app-surface-muted); color: var(--app-text-secondary);
      }
      .rp-mention-me { background: #3b82f6; color: #ffffff; }
      .rp-comment-bubble {
        border: 1px solid var(--app-border); border-radius: 12px;
        background: var(--app-surface-muted); padding: 10px 13px;
        overflow-wrap: anywhere;
      }
      .rp-react-btn {
        display: inline-flex; align-items: center; gap: 6px;
        border: 1px solid var(--app-border); border-radius: 9999px;
        background: var(--app-surface-muted); padding: 2px 10px;
        font-size: 12px; font-weight: 600; color: var(--app-text-primary);
      }
      .rp-react-btn-on { border-color: #3b82f6; background: rgba(59,130,246,.16); }
      .rp-react-add {
        display: inline-flex; align-items: center; justify-content: center;
        width: 28px; height: 28px; border-radius: 9999px;
        border: 1px solid var(--app-border); background: var(--app-surface-muted);
        color: var(--app-text-secondary);
      }
      .rp-react-add:hover, .rp-composer-trigger:hover { border-color: #8b5cf6; }
      .rp-link-btn { text-decoration: underline; color: var(--app-text-secondary); }
      .rp-link-btn:hover { color: var(--app-text-primary); }
      .rp-composer-trigger {
        width: 100%; text-align: left; border: 1px solid var(--app-border);
        border-radius: 12px; background: var(--app-surface-muted);
        padding: 12px 14px; font-size: 14px; color: var(--app-text-muted);
      }
      .rp-notes-editor:empty::before { content: attr(data-placeholder); color: var(--app-text-muted); }
      .rp-notes-editor ul { list-style: disc; padding-left: 20px; }
      .rp-notes-editor ol { list-style: decimal; padding-left: 20px; }
      .rp-select {
        background: var(--app-surface); color: var(--app-text-primary);
        border: 1px solid var(--app-border); border-radius: 8px;
        padding: 6px 10px; font-size: 13px; font-weight: 600;
      }
      .rp-row-hover:hover { background: var(--app-surface-muted); }
    `}</style>
  );
}

function CandidateHeaderSummary({ candidate }: { candidate: CandidateMini }) {
  const processStatus = processStatusConfig[candidate.processStatus];
  const resumeStatus = resumeStatusConfig[candidate.resumeStatus];
  const talentType = talentTypeConfig[candidate.talentType];
  const automationInsights = getAutomationInsights(candidate);

  const resumeTone =
    candidate.resumeStatus === "resume_ready"
      ? "green"
      : candidate.resumeStatus === "wip_resume"
        ? "amber"
        : "gray";

  const talentTone =
    candidate.talentType === "external"
      ? "blue"
      : candidate.talentType === "internal_candidate"
        ? "violet"
        : "amber";

  const daysTone =
    typeof candidate.daysInProcess === "number" && candidate.daysInProcess >= 14
      ? "red"
      : "amber";

  const ResumeIcon =
    candidate.resumeStatus === "resume_ready"
      ? CheckCircle2
      : candidate.resumeStatus === "wip_resume"
        ? Clock3
        : FileText;

  const TalentIcon = candidate.talentType === "external" ? Globe : UserCheck;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:overflow-x-auto">
        <span className="rp-chip rp-chip-violet">
          <FlaskConical aria-hidden="true" />
          {processStatus.label}
        </span>

        <span className={`rp-chip rp-chip-${resumeTone}`}>
          <ResumeIcon aria-hidden="true" />
          {resumeStatus.label}
        </span>

        <span className={`rp-chip rp-chip-${talentTone}`}>
          <TalentIcon aria-hidden="true" />
          {talentType.label}
        </span>

        {typeof candidate.daysInProcess === "number" && (
          <span className={`rp-chip rp-chip-${daysTone}`}>
            <Clock3 aria-hidden="true" />
            {candidate.daysInProcess} days in process
          </span>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-violet-500" />
          <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
            Automation insights
          </p>
        </div>

        <div className="grid gap-2.5 md:grid-cols-3">
          {automationInsights.length > 0 ? (
            automationInsights.map((insight) => (
              <div
                key={insight.id}
                className={`rp-detail-insight flex items-start gap-3 rounded-xl border px-3 py-2.5 ${automationInsightClassName(
                  insight.severity
                )}`}
              >
                <div className="mt-0.5 shrink-0">
                  <AutomationIcon icon={insight.icon} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold">{insight.title}</p>
                  <p className="mt-0.5 text-xs leading-5">{insight.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed px-3 py-3 text-center text-sm app-border app-text-muted md:col-span-3">
              No automation insights for this candidate yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type PersonalInfoRowProps = {
  icon: ReactNode;
  label: string;
  children: ReactNode;
};

function PersonalInfoRow({ icon, label, children }: PersonalInfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t px-4 py-2.5 first:border-t-0 app-border">
      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide app-text-muted">
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        {label}
      </span>

      <span className="min-w-0 text-right text-sm font-medium app-text-primary">
        {children}
      </span>
    </div>
  );
}

function NotDefined() {
  return <span className="app-text-muted">Not defined</span>;
}

function ExternalLinkValue({ value }: { value?: string }) {
  if (!value) {
    return <NotDefined />;
  }

  const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-violet-500 hover:underline"
    >
      {value}
    </a>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

type CandidateDetailContentProps = {
  candidate: CandidateMini;
};

function CandidateDetailContent({ candidate }: CandidateDetailContentProps) {
  const salaryValue =
    candidate.salaryCurrent || candidate.salaryExpected
      ? `${candidate.salaryCurrent || "Not defined"} actual · ${
          candidate.salaryExpected || "Not defined"
        } expected`
      : null;

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 app-text-muted" />
          <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
            Process metrics
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoBox label="Recruiter owner">
            {candidate.recruiterOwner || "Not defined"}
          </InfoBox>

          <InfoBox label="Days in process">
            {candidate.daysInProcess ?? "Not defined"}
          </InfoBox>

          <InfoBox label="Last contact">
            {candidate.lastContactAt || "Not defined"}
          </InfoBox>

          <InfoBox label="Source">{candidate.source || "Not defined"}</InfoBox>
        </div>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide app-text-muted">
          Personal info
        </p>

        <div className="overflow-hidden rounded-xl border app-border app-card">
          <PersonalInfoRow icon={<UserRound />} label="Role">
            {candidate.role}
          </PersonalInfoRow>

          <PersonalInfoRow icon={<Mail />} label="Mail">
            {candidate.email || <NotDefined />}
          </PersonalInfoRow>

          <PersonalInfoRow icon={<LinkIcon />} label="LinkedIn">
            <ExternalLinkValue value={candidate.linkedin} />
          </PersonalInfoRow>

          <PersonalInfoRow icon={<LinkIcon />} label="Portfolio">
            <ExternalLinkValue value={candidate.portfolio} />
          </PersonalInfoRow>

          <PersonalInfoRow icon={<DollarSign />} label="Salary">
            {salaryValue || <NotDefined />}
          </PersonalInfoRow>

          <PersonalInfoRow icon={<BookOpen />} label="English level">
            {candidate.englishLevel || <NotDefined />}
          </PersonalInfoRow>

          <PersonalInfoRow icon={<BriefcaseBusiness />} label="Work relation">
            {candidate.workRelation || <NotDefined />}
          </PersonalInfoRow>

          <PersonalInfoRow icon={<MapPin />} label="Location">
            {candidate.location}
          </PersonalInfoRow>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
            Recruiter notes
          </p>
        </div>

        <RichTextEditor
          key={candidate.id}
          storageKey={`rp-notes:candidate:${candidate.id}`}
          initialText={candidate.notes}
          placeholder="Write a note..."
          ariaLabel="Recruiter notes"
        />
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 app-text-muted" />
          <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
            Process timeline
          </p>
        </div>

        <div className="rounded-xl border p-4 app-border app-card">
          {candidate.timeline && candidate.timeline.length > 0 ? (
            <div className="relative space-y-5 pl-6 before:absolute before:bottom-1 before:left-[5px] before:top-2 before:w-px before:bg-violet-500/40">
              {candidate.timeline.map((item) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full bg-violet-500" />

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold app-text-primary">
                      {item.title}
                    </p>

                    <span className="text-xs app-text-muted">
                      {item.date} · {item.author}
                    </span>
                  </div>

                  <p className="mt-1 text-sm leading-6 app-text-secondary">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-3 py-5 text-center text-sm app-border app-text-muted">
              No timeline activity yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type CommentsActivityPanelProps = {
  activities: LocalActivity[];
  onAddComment: (text: string) => void;
  onDeleteActivity: (activityId: string) => void;
  onToggleReaction: (activityId: string) => void;
};

function CommentsActivityPanel({
  activities,
  onAddComment,
  onDeleteActivity,
  onToggleReaction,
}: CommentsActivityPanelProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [showDetails, setShowDetails] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visibleActivities = showDetails
    ? activities
    : activities.filter((activity) => activity.type === "comment");

  const openComposer = (prefill?: string) => {
    setIsComposerOpen(true);

    if (prefill) {
      setDraft(prefill);
    }

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }
    });
  };

  const closeComposer = () => {
    setIsComposerOpen(false);
    setDraft("");
  };

  const submitComment = () => {
    const trimmedDraft = draft.trim();

    if (!trimmedDraft) {
      return;
    }

    onAddComment(trimmedDraft);
    closeComposer();
    listRef.current?.scrollTo({ top: 0 });
  };

  const insertMention = () => {
    const textarea = textareaRef.current;
    const position = textarea?.selectionStart ?? draft.length;

    setDraft(draft.slice(0, position) + "@" + draft.slice(position));

    requestAnimationFrame(() => {
      textarea?.focus();
      textarea?.setSelectionRange(position + 1, position + 1);
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2.5 pt-4">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="h-4 w-4 app-text-secondary" />
          <h3 className="text-sm font-semibold app-text-primary">
            Comments and activity
          </h3>
        </div>

        <button
          onClick={() => setShowDetails((current) => !current)}
          className="rounded-xl border px-3 py-1.5 text-xs font-semibold app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>
      </div>

      <div className="shrink-0 px-5 pb-3">
        {isComposerOpen ? (
          <div>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeComposer();
                }

                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  submitComment();
                }
              }}
              placeholder="Write a comment..."
              className="min-h-[84px] max-h-40 w-full resize-y rounded-xl border border-violet-500 px-3 py-2 text-sm outline-none app-card app-text-primary placeholder:text-zinc-400"
            />

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={submitComment}
                disabled={!draft.trim()}
                className="rounded-xl px-4 py-2 text-sm font-medium app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Comment
              </button>

              <button
                onClick={insertMention}
                className="rounded-xl border px-4 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                @ Mention user
              </button>

              <button
                onClick={closeComposer}
                className="rp-link-btn px-2 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => openComposer()}
            className="rp-composer-trigger"
          >
            Write a comment...
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto border-t app-border"
      >
        {visibleActivities.length > 0 ? (
          visibleActivities.map((activity) =>
            activity.type === "comment" ? (
              <CommentItem
                key={activity.id}
                activity={activity}
                onReply={(author) => openComposer(`@${author} `)}
                onDelete={() => onDeleteActivity(activity.id)}
                onToggleReaction={() => onToggleReaction(activity.id)}
              />
            ) : (
              <ActivityEventItem key={activity.id} activity={activity} />
            )
          )
        ) : (
          <p className="px-5 py-8 text-center text-sm app-text-muted">
            No comments yet. Write the first one.
          </p>
        )}
      </div>
    </div>
  );
}

type CommentItemProps = {
  activity: LocalActivity;
  onReply: (author: string) => void;
  onDelete: () => void;
  onToggleReaction: () => void;
};

function CommentItem({
  activity,
  onReply,
  onDelete,
  onToggleReaction,
}: CommentItemProps) {
  const author = activity.author || (activity.initials === "GA" ? "Germán" : activity.initials);
  const time = activity.createdAt ? formatRelativeTime(activity.createdAt) : activity.meta;
  const paragraphs = activity.text.split(/\n+/).filter(Boolean);

  return (
    <div className="flex gap-3 border-b px-5 py-4 app-border">
      <div className="rp-avatar-badge flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {activity.initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold app-text-primary">{author}</span>
          <span className="text-xs text-blue-500 underline">{time}</span>
          {activity.edited && (
            <span className="text-xs app-text-muted">(edited)</span>
          )}
        </div>

        <div className="rp-comment-bubble mt-1.5 text-sm leading-6 app-text-primary">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className={index > 0 ? "mt-2.5" : ""}>
              {renderTextWithMentions(paragraph)}
            </p>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs app-text-secondary">
          {activity.reaction && (
            <button
              onClick={onToggleReaction}
              className={`rp-react-btn ${
                activity.reaction.reacted ? "rp-react-btn-on" : ""
              }`}
            >
              <span>{activity.reaction.emoji}</span>
              <span>{activity.reaction.count}</span>
            </button>
          )}

          <button
            onClick={onToggleReaction}
            aria-label="Add reaction"
            className="rp-react-add"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>

          <button onClick={() => onReply(author.split(" ")[0])} className="rp-link-btn">
            Reply
          </button>

          <span aria-hidden="true">•</span>

          <button onClick={onDelete} className="rp-link-btn">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityEventItem({ activity }: { activity: LocalActivity }) {
  const time = activity.createdAt ? formatRelativeTime(activity.createdAt) : activity.meta;

  return (
    <div className="flex items-center gap-3 border-b px-5 py-2.5 app-border">
      <div className="rp-avatar-badge flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
        {activity.initials}
      </div>

      <p className="min-w-0 text-xs app-text-secondary">
        <span className="app-text-primary">{activity.text}</span>
        <span className="ml-2 app-text-muted">{time}</span>
      </p>
    </div>
  );
}

type InfoBoxProps = {
  label: string;
  children: ReactNode;
};

function InfoBox({ label, children }: InfoBoxProps) {
  return (
    <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
      <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium app-text-primary">{children}</p>
    </div>
  );
}