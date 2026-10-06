"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bold,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  FileText,
  FlaskConical,
  Globe,
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
  ];
}

export function ResourcePlanningDetailModal({
  project,
  initialPosition = null,
  initialCandidate = null,
  onClose,
  onCandidateUpdate,
  onPositionUpdate,
  onProjectUpdate,
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

  const effectiveSelectedPosition = selectedPosition
    ? applyPositionOverride(selectedPosition, positionOverrides)
    : null;

  const effectiveSelectedCandidate = selectedCandidate
    ? applyCandidateOverride(selectedCandidate, candidateOverrides)
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
        </header>

        <div className="grid h-[78vh] min-h-[620px] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[minmax(0,1fr)]">
          <main className="h-full overflow-y-auto px-6 py-5">
            {isProjectView && (
              <ProjectDetailContent
                project={effectiveProject}
                onPositionClick={setSelectedPosition}
              />
            )}

            {isPositionView && effectiveSelectedPosition && (
              <PositionDetailContent
                project={effectiveProject}
                position={effectiveSelectedPosition}
                onCandidateClick={setSelectedCandidate}
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

type ProjectDetailContentProps = {
  project: ProjectColumnType;
  onPositionClick: (position: PositionCardType) => void;
};

function ProjectDetailContent({
  project,
  onPositionClick,
}: ProjectDetailContentProps) {
  const projectConfig = projectStatusConfig[project.status];

  const openPositions = project.positions.filter(
    (position) => position.status === "open"
  ).length;

  const totalCandidates = project.positions.reduce(
    (acc, position) => acc + position.candidates.length,
    0
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
          <Plus className="h-4 w-4" />
          Add position
        </button>

        <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
          <Users className="h-4 w-4" />
          Members
        </button>

        <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
          <Paperclip className="h-4 w-4" />
          Attachment
        </button>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide app-text-muted">
          Labels
        </p>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rp-board-badge rounded-md border px-3 py-1.5 text-xs font-semibold ${projectConfig.className}`}
          >
            {projectConfig.label}
          </span>

          <span className="rp-priority-badge rounded-md px-3 py-1.5 text-xs font-semibold">
            {project.priority.toUpperCase()} PRIORITY
          </span>

          {project.confidential ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Lock className="h-3.5 w-3.5" />
              CONFIDENTIAL
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
              <Unlock className="h-3.5 w-3.5" />
              PUBLIC
            </span>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border app-border app-card">
        <div className="relative h-52 overflow-hidden">
          <img
            src={project.cover}
            alt={project.projectName}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-sm font-medium text-white/80">
              {project.clientName}
            </p>

            <h3 className="text-2xl font-semibold text-white">
              {project.projectName}
            </h3>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 app-text-secondary" />
            <h3 className="text-sm font-semibold app-text-primary">
              Project brief
            </h3>
          </div>

          <p className="mt-3 text-sm leading-6 app-text-secondary">
            {project.description}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <InfoBox label="Open positions">{openPositions}</InfoBox>
            <InfoBox label="Candidates linked">{totalCandidates}</InfoBox>
            <InfoBox label="Project status">{projectConfig.label}</InfoBox>
            <InfoBox label="Confidential">
              {project.confidential ? "Yes" : "No"}
            </InfoBox>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 app-text-secondary" />
            <h3 className="text-sm font-semibold app-text-primary">
              Project positions
            </h3>
          </div>

          <span className="rounded-full border px-2 py-1 text-xs app-border app-text-secondary">
            {project.positions.length}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {project.positions.map((position) => {
            const positionConfig = positionStatusConfig[position.status];

            return (
              <button
                key={position.id}
                onClick={() => onPositionClick(position)}
                className="overflow-hidden rounded-2xl border text-left shadow-sm transition app-border app-card hover:border-violet-500/40 hover:shadow-md"
              >
                <div className={`h-1.5 ${positionConfig.barClass}`} />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold app-text-primary">
                        {position.title}
                      </p>

                      <p className="mt-1 text-xs app-text-secondary">
                        Seniority: {position.seniority}
                      </p>
                    </div>

                    <span
                      className={`rp-board-badge shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${positionConfig.badgeClass}`}
                    >
                      {positionConfig.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs app-text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5" />
                      {position.owner}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {position.candidates.length}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

type PositionDetailContentProps = {
  project: ProjectColumnType;
  position: PositionCardType;
  onCandidateClick: (candidate: CandidateMini) => void;
};

function PositionDetailContent({
  project,
  position,
  onCandidateClick,
}: PositionDetailContentProps) {
  const config = positionStatusConfig[position.status];

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
          <Plus className="h-4 w-4" />
          Add candidate
        </button>

        <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
          <CalendarDays className="h-4 w-4" />
          Dates
        </button>

        <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
          <Users className="h-4 w-4" />
          Members
        </button>

        <button className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
          <Paperclip className="h-4 w-4" />
          Attachment
        </button>
      </section>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide app-text-muted">
          Labels
        </p>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rp-board-badge rounded-md border px-3 py-1.5 text-xs font-semibold ${config.badgeClass}`}
          >
            {config.label}
          </span>

          <span className="rp-priority-badge rounded-md px-3 py-1.5 text-xs font-semibold">
            {project.priority.toUpperCase()} PRIORITY
          </span>

          {project.confidential && (
            <span className="rounded-md border border-red-500/40 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white">
              CONFIDENTIAL
            </span>
          )}
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4 app-text-secondary" />
          <h3 className="text-sm font-semibold app-text-primary">
            Position brief / JD
          </h3>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-6 app-text-secondary">
          <p>
            Esta sección va a contener la JD completa o las instrucciones del
            pedido solicitado por el cliente. En esta capa queda como mock visual
            para validar experiencia.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox label="Client / Project">
              {project.clientName} · {project.projectName}
            </InfoBox>

            <InfoBox label="Base role">
              {position.title} · {position.seniority}
            </InfoBox>

            <InfoBox label="Owner">{position.owner}</InfoBox>

            <InfoBox label="Candidates linked">
              {position.candidates.length}
            </InfoBox>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 app-text-secondary" />
            <h3 className="text-sm font-semibold app-text-primary">
              Candidates assigned
            </h3>
          </div>

          <span className="rounded-full border px-2 py-1 text-xs app-border app-text-secondary">
            {position.candidates.length}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
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
  currentIndex: number;
  total: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

function CandidatePager({
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
        aria-label="Previous candidate"
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
        aria-label="Next candidate"
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

type RecruiterNotesEditorProps = {
  candidateId: string;
  initialNotes?: string;
};

function RecruiterNotesEditor({
  candidateId,
  initialNotes,
}: RecruiterNotesEditorProps) {
  const storageKey = `rp-notes:candidate:${candidateId}`;
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    let storedNotes: string | null = null;

    try {
      storedNotes = window.localStorage.getItem(storageKey);
    } catch {
      storedNotes = null;
    }

    editor.innerHTML =
      storedNotes ?? escapeHtml(initialNotes || "").replace(/\n/g, "<br>");
  }, [storageKey, initialNotes]);

  const persistNotes = () => {
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
    persistNotes();
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
        aria-label="Recruiter notes"
        data-placeholder="Write a note..."
        spellCheck={false}
        onInput={persistNotes}
        className="rp-notes-editor min-h-[130px] px-4 py-3 text-sm leading-6 outline-none app-text-primary"
      />
    </div>
  );
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

        <RecruiterNotesEditor
          key={candidate.id}
          candidateId={candidate.id}
          initialNotes={candidate.notes}
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