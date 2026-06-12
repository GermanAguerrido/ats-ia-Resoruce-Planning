"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LinkIcon,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  PauseCircle,
  Plus,
  ShieldCheck,
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

        <header className="flex items-start justify-between gap-4 border-b px-6 py-5 app-border">
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
            <button className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="grid h-[78vh] min-h-[620px] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_380px]">
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
                <CandidateDetailContent
                  candidate={effectiveSelectedCandidate}
                  project={effectiveProject}
                  position={effectiveSelectedPosition}
                />
              )}
          </main>

          <aside className="h-full min-h-0 overflow-y-scroll border-t p-5 app-border app-card lg:border-l lg:border-t-0">
            <CommentsActivityPanel
              mode={
                isCandidateView
                  ? "candidate"
                  : isPositionView
                    ? "position"
                    : "project"
              }
              project={effectiveProject}
              position={effectiveSelectedPosition}
              candidate={effectiveSelectedCandidate}
              onPositionClick={setSelectedPosition}
              onCandidateClick={setSelectedCandidate}
              onQuickAction={handleQuickAction}
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

      {level === "candidate" && (
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

type CandidateDetailContentProps = {
  candidate: CandidateMini;
  project: ProjectColumnType;
  position: PositionCardType;
};

function CandidateDetailContent({
  candidate,
  project,
  position,
}: CandidateDetailContentProps) {
  const processStatus = processStatusConfig[candidate.processStatus];
  const resumeStatus = resumeStatusConfig[candidate.resumeStatus];
  const talentType = talentTypeConfig[candidate.talentType];
  const automationInsights = getAutomationInsights(candidate);

  return (
    <div className="space-y-5">
      <style>{`
        html:not([data-theme="dark"]) .rp-detail-insight,
        html:not([data-theme="dark"]) .rp-detail-insight * {
          color: #09090b !important;
          opacity: 1 !important;
        }

        html:not([data-theme="dark"]) .rp-detail-insight svg {
          color: #09090b !important;
          stroke: currentColor !important;
        }

        .rp-sidebar-active-candidate {
          background-color: var(--app-surface) !important;
          color: var(--app-text-primary) !important;
          border-color: #8b5cf6 !important;
          box-shadow: inset 4px 0 0 #8b5cf6;
        }

        .rp-sidebar-active-candidate,
        .rp-sidebar-active-candidate * {
          color: var(--app-text-primary) !important;
          opacity: 1 !important;
        }
      `}</style>

      <section>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide app-text-muted">
          Structured status
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <StatusBox
            label="Process Status"
            value={processStatus.label}
            className={processStatus.className}
          />

          <StatusBox
            label="Resume Status"
            value={resumeStatus.label}
            className={resumeStatus.className}
          />

          <StatusBox
            label="Talent Type"
            value={talentType.label}
            className={talentType.className}
          />
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold app-text-primary">
            Automation insights
          </h3>
        </div>

        <div className="mt-4 space-y-3">
          {automationInsights.length > 0 ? (
            automationInsights.map((insight) => (
              <div
                key={insight.id}
                className={`rp-detail-insight rounded-2xl border p-4 ${automationInsightClassName(
                  insight.severity
                )}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    <AutomationIcon icon={insight.icon} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">{insight.title}</p>
                    <p className="mt-1 text-sm leading-6">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed px-3 py-5 text-center text-sm app-border app-text-muted">
              No automation insights for this candidate yet.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 app-text-secondary" />
          <h3 className="text-sm font-semibold app-text-primary">
            Process metrics
          </h3>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <InfoBox label="Recruiter owner">
            {candidate.recruiterOwner || "Not defined"}
          </InfoBox>

          <InfoBox label="Days in process">
            {candidate.daysInProcess ?? "Not defined"}
          </InfoBox>

          <InfoBox label="Last contact">
            {candidate.lastContactAt || "Not defined"}
          </InfoBox>
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 app-text-secondary" />
          <h3 className="text-sm font-semibold app-text-primary">
            Candidate overview
          </h3>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoBox label="Role">{candidate.role}</InfoBox>
          <InfoBox label="Location">{candidate.location}</InfoBox>
          <InfoBox label="Source">{candidate.source || "Not defined"}</InfoBox>
          <InfoBox label="English">
            {candidate.englishLevel || "Not defined"}
          </InfoBox>
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-4 w-4 app-text-secondary" />
          <h3 className="text-sm font-semibold app-text-primary">
            Assigned position
          </h3>
        </div>

        <div className="mt-4 rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
          <p className="text-sm font-semibold app-text-primary">
            {position.title} · {position.seniority}
          </p>

          <p className="mt-1 text-sm app-text-secondary">
            {project.clientName} · {project.projectName}
          </p>

          <p className="mt-2 text-xs app-text-muted">
            Este candidato mantiene Candidate ID único aunque pueda estar
            asociado a más de una posición.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 app-text-secondary" />
          <h3 className="text-sm font-semibold app-text-primary">
            Description
          </h3>
        </div>

        <div className="mt-4 space-y-4 text-sm app-text-secondary">
          <DescriptionRow
            icon={<LinkIcon className="h-4 w-4" />}
            label="LinkedIn"
            value={candidate.linkedin || "Not defined"}
          />

          <DescriptionRow
            icon={<LinkIcon className="h-4 w-4" />}
            label="Portfolio"
            value={candidate.portfolio || "Not defined"}
          />

          <DescriptionRow
            icon={<Mail className="h-4 w-4" />}
            label="Mail"
            value={candidate.email || "Not defined"}
          />

          <DescriptionRow
            icon={<MapPin className="h-4 w-4" />}
            label="Salary"
            value={`Actual: ${
              candidate.salaryCurrent || "Not defined"
            } · Pretendido: ${candidate.salaryExpected || "Not defined"}`}
          />

          <InfoBox label="Relación laboral">
            {candidate.workRelation || "Not defined"}
          </InfoBox>
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold app-text-primary">
            Recruiter notes
          </h3>
        </div>

        <p className="mt-3 text-sm leading-6 app-text-secondary">
          {candidate.notes || "No recruiter notes yet."}
        </p>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 app-text-secondary" />
          <h3 className="text-sm font-semibold app-text-primary">
            Process timeline
          </h3>
        </div>

        <div className="mt-5 space-y-4">
          {candidate.timeline && candidate.timeline.length > 0 ? (
            candidate.timeline.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" />

                <div className="min-w-0">
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
              </div>
            ))
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
  mode: "project" | "position" | "candidate";
  project: ProjectColumnType;
  position: PositionCardType | null;
  candidate: CandidateMini | null;
  onPositionClick: (position: PositionCardType) => void;
  onCandidateClick: (candidate: CandidateMini) => void;
  onQuickAction: (actionId: QuickActionId) => QuickActionResult;
};

function CommentsActivityPanel({
  mode,
  project,
  position,
  candidate,
  onPositionClick,
  onCandidateClick,
  onQuickAction,
}: CommentsActivityPanelProps) {
  const [comment, setComment] = useState("");
  const [localActivities, setLocalActivities] = useState<LocalActivity[]>([]);

  const activityStorageKey = useMemo(() => {
    return buildActivityStorageKey({
      mode,
      project,
      position,
      candidate,
    });
  }, [mode, project.id, position?.id, candidate?.id]);

  useEffect(() => {
    setLocalActivities(readStoredActivities(activityStorageKey));
  }, [activityStorageKey]);

  const contextLabel =
    mode === "candidate" && candidate && position
      ? `${candidate.name} · ${position.title}`
      : mode === "position" && position
        ? `${position.title} · ${project.projectName}`
        : `${project.projectName}`;

  const addActivity = (text: string, type: LocalActivity["type"]) => {
    const nextActivity: LocalActivity = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      initials: "GA",
      text,
      meta:
        type === "comment"
          ? `Comment · Just now · ${contextLabel}`
          : `Action · Just now · ${contextLabel}`,
      type,
    };

    setLocalActivities((currentActivities) => {
      const nextActivities = [nextActivity, ...currentActivities];

      writeStoredActivities(activityStorageKey, nextActivities);

      return nextActivities;
    });
  };

  const clearActivityHistory = () => {
    setLocalActivities([]);
    writeStoredActivities(activityStorageKey, []);
  };

  const handleCommentSubmit = () => {
    const trimmedComment = comment.trim();

    if (!trimmedComment) {
      return;
    }

    addActivity(trimmedComment, "comment");
    setComment("");
  };

  const handleQuickActionClick = (actionId: QuickActionId) => {
    const result = onQuickAction(actionId);

    addActivity(result.activityText, "action");

    if (result.nextCandidate) {
      onCandidateClick(result.nextCandidate);
    }

    if (result.nextPosition) {
      onPositionClick(result.nextPosition);
    }
  };

  const baseActivities: LocalActivity[] = [
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

  const visibleActivities = [...localActivities, ...baseActivities];

  return (
    <div className="flex min-h-full flex-col pr-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 app-text-secondary" />
          <h3 className="text-sm font-semibold app-text-primary">
            Comments and activity
          </h3>
        </div>

        <button
          onClick={clearActivityHistory}
          className="rounded-xl border px-3 py-1.5 text-xs font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
        >
          Clear local
        </button>
      </div>

      <QuickActions
        mode={mode}
        candidate={candidate}
        position={position}
        onAction={handleQuickActionClick}
      />

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide app-text-muted">
          New comment
        </p>

        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Write a comment..."
          className="min-h-[84px] w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none app-border app-card app-text-primary placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />

        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={handleCommentSubmit}
            className="rounded-xl px-4 py-2 text-sm font-medium app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!comment.trim()}
          >
            Comment
          </button>

          <button
            onClick={() => handleQuickActionClick("mention_user")}
            className="rounded-xl border px-4 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            Mention user
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
            Recent activity
          </p>

          <span className="rounded-full border px-2 py-1 text-[11px] app-border app-text-muted">
            {visibleActivities.length}
          </span>
        </div>

        <div className="mt-4 space-y-5">
          {visibleActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              initials={activity.initials}
              text={activity.text}
              meta={activity.meta}
              type={activity.type}
            />
          ))}
        </div>
      </div>

      {mode === "project" && (
        <SidebarProjectList
          project={project}
          onPositionClick={onPositionClick}
        />
      )}

      {mode === "position" && position && (
        <SidebarCandidateList
          position={position}
          activeCandidateId={null}
          onCandidateClick={onCandidateClick}
        />
      )}

      {mode === "candidate" && position && (
        <SidebarCandidateList
          position={position}
          activeCandidateId={candidate?.id || null}
          onCandidateClick={onCandidateClick}
        />
      )}
    </div>
  );
}

type QuickActionOption = {
  id: QuickActionId;
  label: string;
};

type QuickActionsProps = {
  mode: "project" | "position" | "candidate";
  candidate: CandidateMini | null;
  position: PositionCardType | null;
  onAction: (actionId: QuickActionId) => void;
};

function QuickActions({
  mode,
  candidate,
  position,
  onAction,
}: QuickActionsProps) {
  const actions: QuickActionOption[] =
    mode === "candidate" && candidate
      ? [
          {
            id: "change_candidate_status",
            label: "Change candidate status",
          },
          {
            id: "assign_recruiter",
            label: "Assign recruiter",
          },
          {
            id: "mark_resume_ready",
            label: "Mark resume ready",
          },
          {
            id: "move_to_trick_internal",
            label: "Move to Trick Internal",
          },
        ]
      : mode === "position" && position
        ? [
            {
              id: "change_position_status",
              label: "Change position status",
            },
            {
              id: "assign_internal_member",
              label: "Assign internal member",
            },
            {
              id: "request_more_candidates",
              label: "Request more candidates",
            },
            {
              id: "mark_jd_reviewed",
              label: "Mark JD as reviewed",
            },
          ]
        : [
            {
              id: "update_project_priority",
              label: "Update project priority",
            },
            {
              id: "add_project_member",
              label: "Add project member",
            },
            {
              id: "mark_as_confidential",
              label: "Mark as confidential",
            },
            {
              id: "request_client_follow_up",
              label: "Request client follow-up",
            },
          ];

  return (
    <div className="mt-5 rounded-2xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
          Quick actions
        </p>

        <span className="rounded-full border px-2 py-1 text-[11px] app-border app-text-muted">
          Local mock
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="rounded-xl border px-3 py-2 text-left text-sm font-medium transition app-border app-card app-text-primary hover:border-violet-500/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type SidebarProjectListProps = {
  project: ProjectColumnType;
  onPositionClick: (position: PositionCardType) => void;
};

function SidebarProjectList({
  project,
  onPositionClick,
}: SidebarProjectListProps) {
  return (
    <div className="mt-5 rounded-2xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
          Positions in this project
        </p>

        <span className="rounded-full border px-2 py-1 text-[11px] app-border app-text-muted">
          {project.positions.length}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {project.positions.map((item) => (
          <button
            key={item.id}
            onClick={() => onPositionClick(item)}
            className="w-full rounded-xl border px-3 py-2 text-left transition app-border app-card app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <p className="truncate text-sm font-semibold app-text-primary">
              {item.title}
            </p>

            <p className="mt-0.5 truncate text-xs app-text-muted">
              {item.seniority} · {item.candidates.length} candidates ·{" "}
              {positionStatusConfig[item.status].label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

type SidebarCandidateListProps = {
  position: PositionCardType;
  activeCandidateId: string | null;
  onCandidateClick: (candidate: CandidateMini) => void;
};

function SidebarCandidateList({
  position,
  activeCandidateId,
  onCandidateClick,
}: SidebarCandidateListProps) {
  return (
    <div className="mt-5 rounded-2xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
          Candidates in this position
        </p>

        <span className="rounded-full border px-2 py-1 text-[11px] app-border app-text-muted">
          {position.candidates.length}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {position.candidates.length > 0 ? (
          position.candidates.map((item) => {
            const active = activeCandidateId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onCandidateClick(item)}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  active
                    ? "rp-sidebar-active-candidate"
                    : "app-border app-card app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                }`}
              >
                <p
                  className={`truncate text-sm font-semibold ${
                    active ? "" : "app-text-primary"
                  }`}
                >
                  {item.name}
                </p>

                <p
                  className={`mt-0.5 truncate text-xs ${
                    active ? "" : "app-text-muted"
                  }`}
                >
                  {item.role} · {item.location}
                </p>
              </button>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed px-3 py-4 text-center text-sm app-border app-text-muted">
            No candidates linked yet.
          </div>
        )}
      </div>
    </div>
  );
}

type StatusBoxProps = {
  label: string;
  value: string;
  className: string;
};

function StatusBox({ label, value, className }: StatusBoxProps) {
  return (
    <div className="rounded-2xl border p-4 app-border app-card">
      <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
        {label}
      </p>

      <span
        className={`rp-candidate-badge mt-3 inline-flex rounded-md px-3 py-1.5 text-xs font-semibold ${className}`}
      >
        {value}
      </span>
    </div>
  );
}

type ActivityItemProps = {
  initials: string;
  text: string;
  meta: string;
  type: LocalActivity["type"];
};

function ActivityItem({ initials, text, meta, type }: ActivityItemProps) {
  const typeLabel =
    type === "comment" ? "Comment" : type === "action" ? "Action" : "Activity";

  return (
    <div className="flex gap-3">
      <div className="rp-avatar-badge flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
        {initials}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold app-border app-text-muted">
            {typeLabel}
          </span>
        </div>

        <p className="mt-1 text-sm app-text-primary">{text}</p>
        <p className="mt-1 text-xs app-text-muted">{meta}</p>
      </div>
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

type DescriptionRowProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function DescriptionRow({ icon, label, value }: DescriptionRowProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 shrink-0 app-text-muted">{icon}</div>

      <div>
        <p className="font-medium app-text-primary">{label}</p>
        <p>{value}</p>
      </div>
    </div>
  );
}