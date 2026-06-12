"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BellDot,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  History,
  PauseCircle,
  Plus,
  Search,
  SlidersHorizontal,
  UserCheck,
  Zap,
} from "lucide-react";
import {
  resourcePlanningMock,
  type CandidateMini,
  type PositionCard as PositionCardType,
  type ProjectColumn as ProjectColumnType,
  type ProjectStatus,
} from "@/app/data/resourcePlanningMock";
import { ProjectColumn } from "./ProjectColumn";
import { ResourcePlanningDetailModal } from "./ResourcePlanningDetailModal";
import {
  ResourcePlanningCreateModal,
  type CreateModalMode,
  type NewCandidatePayload,
  type NewPositionPayload,
  type NewProjectPayload,
} from "./ResourcePlanningCreateModal";

type ProjectPriority = ProjectColumnType["priority"];
type PositionStatus = PositionCardType["status"];

type ResourcePlanningFilter = "all" | ProjectStatus;

type SelectedDetail = {
  project: ProjectColumnType;
  position?: PositionCardType | null;
  candidate?: CandidateMini | null;
};

type CreateModalState = {
  mode: CreateModalMode;
  project?: ProjectColumnType | null;
  position?: PositionCardType | null;
};

type NotificationPanel = "position" | "candidate" | null;

type MockUser = {
  id: string;
  name: string;
  role: "admin" | "recruiter" | "lead";
};

type NotificationAudience =
  | "all_project_users"
  | "recruiter_owner"
  | "assigned_users";

type CandidateUpdate = Partial<
  Pick<
    CandidateMini,
    "processStatus" | "resumeStatus" | "talentType" | "recruiterOwner"
  >
>;

type PositionUpdate = Partial<{
  status: PositionStatus;
  owner: string;
}>;

type ProjectUpdate = Partial<{
  status: ProjectStatus;
  priority: ProjectPriority;
  confidential: boolean;
}>;

type NotificationBase = {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  createdAt: string;
  severity: "warning" | "success" | "info" | "neutral";
  audience: NotificationAudience;
  assignedUserIds: string[];
  readByUserIds: string[];
  icon: "alert" | "check" | "clock" | "file" | "pause" | "user" | "zap";
};

type PositionNotification = NotificationBase & {
  type: "position";
  project: ProjectColumnType;
  position: PositionCardType;
};

type CandidateNotification = NotificationBase & {
  type: "candidate";
  project: ProjectColumnType;
  position: PositionCardType;
  candidate: CandidateMini;
};

type ResourcePlanningNotification =
  | PositionNotification
  | CandidateNotification;

const RESOURCE_PLANNING_STORAGE_KEY = "ats-ia:resource-planning:projects:v1";

const mockUsers: MockUser[] = [
  {
    id: "user-german",
    name: "Germán",
    role: "admin",
  },
  {
    id: "user-ana",
    name: "Ana",
    role: "recruiter",
  },
  {
    id: "user-sofia",
    name: "Sofía",
    role: "recruiter",
  },
];

const ownerToUserId: Record<string, string> = {
  Germán: "user-german",
  Ana: "user-ana",
  Sofía: "user-sofia",
};

const filters: Array<{
  key: ResourcePlanningFilter;
  label: string;
}> = [
  {
    key: "active_search",
    label: "Activos con búsquedas",
  },
  {
    key: "coming_soon",
    label: "Coming soon",
  },
  {
    key: "active_no_search",
    label: "Sin búsquedas activas",
  },
  {
    key: "inactive",
    label: "Inactivos",
  },
  {
    key: "all",
    label: "Todos",
  },
];

const priorityWeight = {
  high: 1,
  medium: 2,
  low: 3,
};

const statusWeight = {
  active_search: 1,
  coming_soon: 2,
  active_no_search: 3,
  inactive: 4,
};

function cloneInitialProjects(): ProjectColumnType[] {
  return resourcePlanningMock.map((project) => ({
    ...project,
    positions: project.positions.map((position) => ({
      ...position,
      candidates: position.candidates.map((candidate) => ({
        ...candidate,
        status: [...candidate.status],
        timeline: candidate.timeline
          ? candidate.timeline.map((timelineItem) => ({
              ...timelineItem,
            }))
          : undefined,
      })),
    })),
  }));
}

function isValidStoredProjects(value: unknown): value is ProjectColumnType[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((project) => {
    return (
      project &&
      typeof project === "object" &&
      "id" in project &&
      "clientName" in project &&
      "projectName" in project &&
      "positions" in project &&
      Array.isArray((project as ProjectColumnType).positions)
    );
  });
}

function readStoredProjects(): ProjectColumnType[] | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(
      RESOURCE_PLANNING_STORAGE_KEY
    );

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);

    if (!isValidStoredProjects(parsedValue)) {
      return null;
    }

    return parsedValue;
  } catch {
    return null;
  }
}

function writeStoredProjects(projects: ProjectColumnType[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RESOURCE_PLANNING_STORAGE_KEY,
      JSON.stringify(projects)
    );
  } catch {
    // localStorage can fail in private mode or quota situations.
  }
}

function getCurrentDateString() {
  return new Date().toISOString().slice(0, 10);
}

function buildId(prefix: string, label: string) {
  const safeLabel = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `${prefix}-${safeLabel || "item"}-${Date.now()}`;
}

function getDefaultCover() {
  return (
    resourcePlanningMock[0]?.cover ||
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop"
  );
}

function getPositionNotifications(
  projects: ProjectColumnType[]
): PositionNotification[] {
  const notifications: PositionNotification[] = [];

  projects.forEach((project) => {
    project.positions.forEach((position) => {
      if (position.status === "on_hold") {
        notifications.push({
          id: `position-hold-${project.id}-${position.id}`,
          type: "position",
          title: "Position on hold",
          description: `${position.title} was moved to on hold.`,
          eventDate: "2026-05-29",
          createdAt: "2026-05-29",
          severity: "warning",
          audience: "all_project_users",
          assignedUserIds: mockUsers.map((user) => user.id),
          readByUserIds: ["user-german"],
          project,
          position,
          icon: "pause",
        });
      }

      if (position.status === "cancelled") {
        notifications.push({
          id: `position-cancelled-${project.id}-${position.id}`,
          type: "position",
          title: "Position cancelled",
          description: `${position.title} was cancelled or closed by client.`,
          eventDate: "2026-05-25",
          createdAt: "2026-05-25",
          severity: "neutral",
          audience: "all_project_users",
          assignedUserIds: mockUsers.map((user) => user.id),
          readByUserIds: ["user-ana", "user-sofia"],
          project,
          position,
          icon: "alert",
        });
      }

      if (
        position.status === "open" &&
        project.priority === "high" &&
        position.candidates.length === 0
      ) {
        notifications.push({
          id: `position-no-candidates-${project.id}-${position.id}`,
          type: "position",
          title: "High priority without candidates",
          description: `${position.title} has no candidates linked yet.`,
          eventDate: "2026-06-04",
          createdAt: "2026-06-04",
          severity: "warning",
          audience: "all_project_users",
          assignedUserIds: mockUsers.map((user) => user.id),
          readByUserIds: [],
          project,
          position,
          icon: "alert",
        });
      }

      if (position.status === "hired") {
        notifications.push({
          id: `position-hired-${project.id}-${position.id}`,
          type: "position",
          title: "Position hired",
          description: `${position.title} was marked as hired.`,
          eventDate: "2026-05-31",
          createdAt: "2026-05-31",
          severity: "success",
          audience: "all_project_users",
          assignedUserIds: mockUsers.map((user) => user.id),
          readByUserIds: ["user-german"],
          project,
          position,
          icon: "check",
        });
      }
    });
  });

  return sortNotifications(notifications);
}

function getCandidateNotifications(
  projects: ProjectColumnType[]
): CandidateNotification[] {
  const notifications: CandidateNotification[] = [];

  projects.forEach((project) => {
    project.positions.forEach((position) => {
      position.candidates.forEach((candidate) => {
        const recruiterOwnerUserId =
          ownerToUserId[candidate.recruiterOwner || position.owner] ||
          ownerToUserId[position.owner] ||
          "user-german";

        if (
          typeof candidate.daysInProcess === "number" &&
          candidate.daysInProcess >= 14 &&
          candidate.processStatus !== "hired" &&
          candidate.processStatus !== "rejected"
        ) {
          notifications.push({
            id: `candidate-aging-${project.id}-${position.id}-${candidate.id}`,
            type: "candidate",
            title: "Candidate aging",
            description: `${candidate.name} has been in process for ${candidate.daysInProcess} days.`,
            eventDate: candidate.lastContactAt || "2026-06-04",
            createdAt: candidate.lastContactAt || "2026-06-04",
            severity: "warning",
            audience: "recruiter_owner",
            assignedUserIds: [recruiterOwnerUserId],
            readByUserIds: [],
            project,
            position,
            candidate,
            icon: "alert",
          });
        }

        if (candidate.resumeStatus === "none") {
          notifications.push({
            id: `candidate-resume-missing-${project.id}-${position.id}-${candidate.id}`,
            type: "candidate",
            title: "Resume missing",
            description: `${candidate.name} has no internal resume ready.`,
            eventDate: candidate.lastContactAt || "2026-06-04",
            createdAt: candidate.lastContactAt || "2026-06-04",
            severity: "neutral",
            audience: "recruiter_owner",
            assignedUserIds: [recruiterOwnerUserId],
            readByUserIds: [],
            project,
            position,
            candidate,
            icon: "file",
          });
        }

        if (candidate.resumeStatus === "wip_resume") {
          notifications.push({
            id: `candidate-resume-wip-${project.id}-${position.id}-${candidate.id}`,
            type: "candidate",
            title: "Resume WIP",
            description: `${candidate.name} has internal resume in progress.`,
            eventDate: candidate.lastContactAt || "2026-06-04",
            createdAt: candidate.lastContactAt || "2026-06-04",
            severity: "info",
            audience: "recruiter_owner",
            assignedUserIds: [recruiterOwnerUserId],
            readByUserIds: ["user-german"],
            project,
            position,
            candidate,
            icon: "clock",
          });
        }

        if (
          candidate.resumeStatus === "resume_ready" &&
          candidate.processStatus !== "hired" &&
          candidate.processStatus !== "rejected"
        ) {
          notifications.push({
            id: `candidate-ready-${project.id}-${position.id}-${candidate.id}`,
            type: "candidate",
            title: "Ready to present",
            description: `${candidate.name} has resume ready for next step.`,
            eventDate: candidate.lastContactAt || "2026-06-04",
            createdAt: candidate.lastContactAt || "2026-06-04",
            severity: "success",
            audience: "recruiter_owner",
            assignedUserIds: [recruiterOwnerUserId],
            readByUserIds: ["user-sofia"],
            project,
            position,
            candidate,
            icon: "check",
          });
        }

        if (
          candidate.processStatus === "hired" ||
          candidate.talentType === "trick_internal"
        ) {
          notifications.push({
            id: `candidate-trick-internal-${project.id}-${position.id}-${candidate.id}`,
            type: "candidate",
            title: "Moved to Trick Internal",
            description: `${candidate.name} is marked as hired/internal talent.`,
            eventDate: candidate.lastContactAt || "2026-06-04",
            createdAt: candidate.lastContactAt || "2026-06-04",
            severity: "success",
            audience: "assigned_users",
            assignedUserIds: [recruiterOwnerUserId, "user-german"],
            readByUserIds: ["user-ana"],
            project,
            position,
            candidate,
            icon: "user",
          });
        }

        if (
          candidate.processStatus === "contacted" &&
          candidate.resumeStatus === "none"
        ) {
          notifications.push({
            id: `candidate-early-stage-${project.id}-${position.id}-${candidate.id}`,
            type: "candidate",
            title: "Early-stage follow-up",
            description: `${candidate.name} was contacted but has not moved forward yet.`,
            eventDate: candidate.lastContactAt || "2026-06-04",
            createdAt: candidate.lastContactAt || "2026-06-04",
            severity: "info",
            audience: "recruiter_owner",
            assignedUserIds: [recruiterOwnerUserId],
            readByUserIds: [],
            project,
            position,
            candidate,
            icon: "zap",
          });
        }
      });
    });
  });

  return sortNotifications(notifications);
}

function sortNotifications<T extends ResourcePlanningNotification>(
  notifications: T[]
): T[] {
  return [...notifications].sort((a, b) => {
    const severityWeight = {
      warning: 1,
      neutral: 2,
      info: 3,
      success: 4,
    };

    const severityDiff =
      severityWeight[a.severity] - severityWeight[b.severity];

    if (severityDiff !== 0) {
      return severityDiff;
    }

    return b.eventDate.localeCompare(a.eventDate);
  });
}

function isNotificationVisibleForUser(
  notification: ResourcePlanningNotification,
  currentUser: MockUser
) {
  return notification.assignedUserIds.includes(currentUser.id);
}

function isNotificationRead(
  notification: ResourcePlanningNotification,
  currentUserId: string,
  locallyReadNotificationIds: string[]
) {
  return (
    notification.readByUserIds.includes(currentUserId) ||
    locallyReadNotificationIds.includes(notification.id)
  );
}

function notificationClassName(
  severity: ResourcePlanningNotification["severity"],
  read: boolean
) {
  if (read) {
    return "border-zinc-300 bg-white text-zinc-700 dark:border-white/10 dark:bg-white/[0.035] dark:text-zinc-300";
  }

  if (severity === "warning") {
    return "border-amber-500 bg-amber-100 text-zinc-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100";
  }

  if (severity === "success") {
    return "border-emerald-500 bg-emerald-100 text-zinc-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100";
  }

  if (severity === "info") {
    return "border-blue-500 bg-blue-100 text-zinc-950 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100";
  }

  return "border-zinc-400 bg-zinc-100 text-zinc-950 dark:border-white/15 dark:bg-white/[0.06] dark:text-zinc-100";
}

function NotificationIcon({
  icon,
}: {
  icon: ResourcePlanningNotification["icon"];
}) {
  if (icon === "alert") return <AlertTriangle className="h-4 w-4" />;
  if (icon === "check") return <CheckCircle2 className="h-4 w-4" />;
  if (icon === "clock") return <Clock3 className="h-4 w-4" />;
  if (icon === "file") return <FileText className="h-4 w-4" />;
  if (icon === "pause") return <PauseCircle className="h-4 w-4" />;
  if (icon === "user") return <UserCheck className="h-4 w-4" />;

  return <Zap className="h-4 w-4" />;
}

function applyPositionUpdateToProject(
  project: ProjectColumnType,
  positionId: string,
  updates: PositionUpdate
): ProjectColumnType {
  return {
    ...project,
    positions: project.positions.map((position) =>
      position.id === positionId
        ? {
            ...position,
            ...updates,
          }
        : position
    ),
  };
}

function applyCandidateUpdateToProject(
  project: ProjectColumnType,
  candidateId: string,
  updates: CandidateUpdate
): ProjectColumnType {
  return {
    ...project,
    positions: project.positions.map((position) => ({
      ...position,
      candidates: position.candidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              ...updates,
            }
          : candidate
      ),
    })),
  };
}

function groupNotificationsByReadState<T extends ResourcePlanningNotification>(
  notifications: T[],
  currentUserId: string,
  locallyReadNotificationIds: string[]
) {
  const unread: T[] = [];
  const read: T[] = [];

  notifications.forEach((notification) => {
    if (
      isNotificationRead(
        notification,
        currentUserId,
        locallyReadNotificationIds
      )
    ) {
      read.push(notification);
    } else {
      unread.push(notification);
    }
  });

  return {
    unread,
    read,
  };
}

export function ResourcePlanningBoard() {
  const [projects, setProjects] =
    useState<ProjectColumnType[]>(cloneInitialProjects);

  const [hasLoadedStoredProjects, setHasLoadedStoredProjects] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(
    null
  );

  const [createModal, setCreateModal] = useState<CreateModalState | null>(null);

  const [activeFilter, setActiveFilter] =
    useState<ResourcePlanningFilter>("active_search");

  const [search, setSearch] = useState("");
  const [openNotificationPanel, setOpenNotificationPanel] =
    useState<NotificationPanel>(null);

  const [currentUserId, setCurrentUserId] = useState("user-german");
  const [locallyReadNotificationIds, setLocallyReadNotificationIds] = useState<
    string[]
  >([]);

  useEffect(() => {
    const storedProjects = readStoredProjects();

    if (storedProjects) {
      setProjects(storedProjects);
    }

    setHasLoadedStoredProjects(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStoredProjects) {
      return;
    }

    writeStoredProjects(projects);
  }, [projects, hasLoadedStoredProjects]);

  const currentUser =
    mockUsers.find((user) => user.id === currentUserId) || mockUsers[0];

  const boardStats = useMemo(() => {
    const totalProjects = projects.length;

    const activeSearchProjects = projects.filter(
      (project) => project.status === "active_search"
    ).length;

    const comingSoonProjects = projects.filter(
      (project) => project.status === "coming_soon"
    ).length;

    const totalPositions = projects.reduce(
      (acc, project) => acc + project.positions.length,
      0
    );

    const openPositions = projects.reduce((acc, project) => {
      return (
        acc +
        project.positions.filter((position) => position.status === "open")
          .length
      );
    }, 0);

    const totalCandidates = projects.reduce((acc, project) => {
      return (
        acc +
        project.positions.reduce(
          (positionAcc, position) =>
            positionAcc + position.candidates.length,
          0
        )
      );
    }, 0);

    return {
      totalProjects,
      activeSearchProjects,
      comingSoonProjects,
      totalPositions,
      openPositions,
      totalCandidates,
    };
  }, [projects]);

  const allPositionNotifications = useMemo(() => {
    return getPositionNotifications(projects);
  }, [projects]);

  const allCandidateNotifications = useMemo(() => {
    return getCandidateNotifications(projects);
  }, [projects]);

  const positionNotifications = useMemo(() => {
    return allPositionNotifications.filter((notification) =>
      isNotificationVisibleForUser(notification, currentUser)
    );
  }, [allPositionNotifications, currentUser]);

  const candidateNotifications = useMemo(() => {
    return allCandidateNotifications.filter((notification) =>
      isNotificationVisibleForUser(notification, currentUser)
    );
  }, [allCandidateNotifications, currentUser]);

  const positionNotificationGroups = useMemo(() => {
    return groupNotificationsByReadState(
      positionNotifications,
      currentUser.id,
      locallyReadNotificationIds
    );
  }, [positionNotifications, currentUser.id, locallyReadNotificationIds]);

  const candidateNotificationGroups = useMemo(() => {
    return groupNotificationsByReadState(
      candidateNotifications,
      currentUser.id,
      locallyReadNotificationIds
    );
  }, [candidateNotifications, currentUser.id, locallyReadNotificationIds]);

  const positionSummary = useMemo(() => {
    return {
      onHold: positionNotifications.filter((notification) =>
        notification.id.startsWith("position-hold-")
      ).length,
      cancelled: positionNotifications.filter((notification) =>
        notification.id.startsWith("position-cancelled-")
      ).length,
      noCandidates: positionNotifications.filter((notification) =>
        notification.id.startsWith("position-no-candidates-")
      ).length,
      hired: positionNotifications.filter((notification) =>
        notification.id.startsWith("position-hired-")
      ).length,
    };
  }, [positionNotifications]);

  const candidateSummary = useMemo(() => {
    return {
      aging: candidateNotifications.filter((notification) =>
        notification.id.startsWith("candidate-aging-")
      ).length,
      resumeMissing: candidateNotifications.filter((notification) =>
        notification.id.startsWith("candidate-resume-missing-")
      ).length,
      resumeWip: candidateNotifications.filter((notification) =>
        notification.id.startsWith("candidate-resume-wip-")
      ).length,
      readyToPresent: candidateNotifications.filter((notification) =>
        notification.id.startsWith("candidate-ready-")
      ).length,
      trickInternal: candidateNotifications.filter((notification) =>
        notification.id.startsWith("candidate-trick-internal-")
      ).length,
    };
  }, [candidateNotifications]);

  const visibleProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesFilter =
          activeFilter === "all" || project.status === activeFilter;

        if (!matchesFilter) return false;
        if (!normalizedSearch) return true;

        const projectText = [
          project.clientName,
          project.projectName,
          project.description,
          project.status,
          project.priority,
          project.confidential ? "confidential" : "public",
        ]
          .join(" ")
          .toLowerCase();

        const positionsText = project.positions
          .map((position) => {
            const candidatesText = position.candidates
              .map((candidate) =>
                [
                  candidate.id,
                  candidate.name,
                  candidate.role,
                  candidate.location,
                  candidate.email,
                  candidate.linkedin,
                  candidate.portfolio,
                  candidate.source,
                  candidate.englishLevel,
                  candidate.workRelation,
                  candidate.notes,
                  candidate.processStatus,
                  candidate.resumeStatus,
                  candidate.talentType,
                  candidate.recruiterOwner,
                  candidate.lastContactAt,
                  String(candidate.daysInProcess || ""),
                  ...candidate.status,
                ]
                  .filter(Boolean)
                  .join(" ")
              )
              .join(" ");

            return [
              position.id,
              position.title,
              position.seniority,
              position.status,
              position.owner,
              candidatesText,
            ]
              .filter(Boolean)
              .join(" ");
          })
          .join(" ")
          .toLowerCase();

        return `${projectText} ${positionsText}`.includes(normalizedSearch);
      })
      .sort((projectA, projectB) => {
        const statusDiff =
          statusWeight[projectA.status] - statusWeight[projectB.status];

        if (statusDiff !== 0) return statusDiff;

        const priorityDiff =
          priorityWeight[projectA.priority] -
          priorityWeight[projectB.priority];

        if (priorityDiff !== 0) return priorityDiff;

        return projectA.clientName.localeCompare(projectB.clientName);
      });
  }, [activeFilter, search, projects]);

  const markNotificationAsRead = (notificationId: string) => {
    setLocallyReadNotificationIds((currentIds) => {
      if (currentIds.includes(notificationId)) return currentIds;
      return [...currentIds, notificationId];
    });
  };

  const openPositionNotification = (notification: PositionNotification) => {
    markNotificationAsRead(notification.id);

    setSelectedDetail({
      project: notification.project,
      position: notification.position,
      candidate: null,
    });
  };

  const openCandidateNotification = (notification: CandidateNotification) => {
    markNotificationAsRead(notification.id);

    setSelectedDetail({
      project: notification.project,
      position: notification.position,
      candidate: notification.candidate,
    });
  };

  const handleCandidateUpdate = (
    candidateId: string,
    updates: CandidateUpdate
  ) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        applyCandidateUpdateToProject(project, candidateId, updates)
      )
    );

    setSelectedDetail((currentDetail) => {
      if (!currentDetail) return currentDetail;

      const updatedProject = applyCandidateUpdateToProject(
        currentDetail.project,
        candidateId,
        updates
      );

      const updatedPosition = currentDetail.position
        ? updatedProject.positions.find(
            (position) => position.id === currentDetail.position?.id
          ) || currentDetail.position
        : null;

      const updatedCandidate =
        updatedPosition?.candidates.find(
          (candidate) => candidate.id === candidateId
        ) ||
        (currentDetail.candidate?.id === candidateId
          ? {
              ...currentDetail.candidate,
              ...updates,
            }
          : currentDetail.candidate);

      return {
        project: updatedProject,
        position: updatedPosition,
        candidate: updatedCandidate,
      };
    });
  };

  const handlePositionUpdate = (
    positionId: string,
    updates: PositionUpdate
  ) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        applyPositionUpdateToProject(project, positionId, updates)
      )
    );

    setSelectedDetail((currentDetail) => {
      if (!currentDetail) return currentDetail;

      const updatedProject = applyPositionUpdateToProject(
        currentDetail.project,
        positionId,
        updates
      );

      const updatedPosition =
        updatedProject.positions.find((position) => position.id === positionId) ||
        currentDetail.position ||
        null;

      return {
        project: updatedProject,
        position: updatedPosition,
        candidate: currentDetail.candidate,
      };
    });
  };

  const handleProjectUpdate = (projectId: string, updates: ProjectUpdate) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              ...updates,
            }
          : project
      )
    );

    setSelectedDetail((currentDetail) => {
      if (!currentDetail) return currentDetail;

      if (currentDetail.project.id !== projectId) {
        return currentDetail;
      }

      const updatedProject = {
        ...currentDetail.project,
        ...updates,
      };

      return {
        ...currentDetail,
        project: updatedProject,
      };
    });
  };

  const handleCreateProject = (payload: NewProjectPayload) => {
    const newProject: ProjectColumnType = {
      id: buildId("project", `${payload.clientName}-${payload.projectName}`),
      clientName: payload.clientName,
      projectName: payload.projectName,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
      confidential: payload.confidential,
      cover: getDefaultCover(),
      positions: [],
    };

    setProjects((currentProjects) => [newProject, ...currentProjects]);

    setSelectedDetail({
      project: newProject,
      position: null,
      candidate: null,
    });

    setActiveFilter("all");
    setCreateModal(null);
  };

  const handleCreatePosition = (
    projectId: string,
    payload: NewPositionPayload
  ) => {
    const newPosition: PositionCardType = {
      id: buildId("position", payload.title),
      title: payload.title,
      seniority: payload.seniority,
      owner: payload.owner,
      status: payload.status,
      candidates: [],
    };

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              positions: [newPosition, ...project.positions],
            }
          : project
      )
    );

    setSelectedDetail((currentDetail) => {
      if (!currentDetail || currentDetail.project.id !== projectId) {
        const project = projects.find((item) => item.id === projectId);

        if (!project) {
          return currentDetail;
        }

        return {
          project: {
            ...project,
            positions: [newPosition, ...project.positions],
          },
          position: newPosition,
          candidate: null,
        };
      }

      return {
        project: {
          ...currentDetail.project,
          positions: [newPosition, ...currentDetail.project.positions],
        },
        position: newPosition,
        candidate: null,
      };
    });

    setCreateModal(null);
  };

  const handleCreateCandidate = (
    projectId: string,
    positionId: string,
    payload: NewCandidatePayload
  ) => {
    const today = getCurrentDateString();

    const newCandidate: CandidateMini = {
      id: buildId("candidate", payload.name),
      name: payload.name,
      role: payload.role,
      location: payload.location,
      email: "",
      linkedin: "",
      portfolio: "",
      source: "Manual",
      englishLevel: "Not defined",
      workRelation: "Not defined",
      salaryCurrent: "",
      salaryExpected: "",
      notes: "Candidate created manually from Resource Planning.",
      status: [],
      processStatus: payload.processStatus,
      resumeStatus: payload.resumeStatus,
      talentType: payload.talentType,
      recruiterOwner: payload.recruiterOwner,
      lastContactAt: today,
      daysInProcess: 0,
      timeline: [
        {
          id: buildId("timeline", payload.name),
          title: "Candidate created",
          description: "Candidate was created manually in Resource Planning.",
          date: today,
          author: payload.recruiterOwner,
        },
      ],
    };

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              positions: project.positions.map((position) =>
                position.id === positionId
                  ? {
                      ...position,
                      candidates: [newCandidate, ...position.candidates],
                    }
                  : position
              ),
            }
          : project
      )
    );

    setSelectedDetail((currentDetail) => {
      if (!currentDetail || currentDetail.project.id !== projectId) {
        const project = projects.find((item) => item.id === projectId);

        if (!project) {
          return currentDetail;
        }

        const targetPosition = project.positions.find(
          (position) => position.id === positionId
        );

        if (!targetPosition) {
          return currentDetail;
        }

        const updatedPosition = {
          ...targetPosition,
          candidates: [newCandidate, ...targetPosition.candidates],
        };

        return {
          project: {
            ...project,
            positions: project.positions.map((position) =>
              position.id === positionId ? updatedPosition : position
            ),
          },
          position: updatedPosition,
          candidate: newCandidate,
        };
      }

      const updatedProject = {
        ...currentDetail.project,
        positions: currentDetail.project.positions.map((position) =>
          position.id === positionId
            ? {
                ...position,
                candidates: [newCandidate, ...position.candidates],
              }
            : position
        ),
      };

      const updatedPosition =
        updatedProject.positions.find((position) => position.id === positionId) ||
        null;

      return {
        project: updatedProject,
        position: updatedPosition,
        candidate: newCandidate,
      };
    });

    setCreateModal(null);
  };

  return (
    <main className="flex h-full min-h-[720px] flex-col bg-transparent">
      <section className="border-b px-6 py-5 app-border">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Jobs module
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight app-text-primary">
              Resource Planning
            </h1>

            <p className="mt-1 text-sm app-text-secondary">
              Vista principal para organizar proyectos, posiciones y candidatos
              vinculados.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex h-10 items-center gap-2 rounded-xl border px-3 app-border app-card">
              <UserCheck className="h-4 w-4 app-text-muted" />

              <select
                value={currentUserId}
                onChange={(event) => {
                  setCurrentUserId(event.target.value);
                  setOpenNotificationPanel(null);
                }}
                className="bg-transparent text-sm outline-none app-text-primary"
              >
                {mockUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    Viewing as {user.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                setCreateModal({
                  mode: "project",
                  project: null,
                  position: null,
                })
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium app-button-primary"
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Active searches"
            value={boardStats.activeSearchProjects}
            helper="Projects with open demand"
          />

          <StatCard
            label="Coming soon"
            value={boardStats.comingSoonProjects}
            helper="Waiting approval"
          />

          <StatCard
            label="Open positions"
            value={boardStats.openPositions}
            helper={`${boardStats.totalPositions} total positions`}
          />

          <StatCard
            label="Candidates"
            value={boardStats.totalCandidates}
            helper="Linked to positions"
          />

          <StatCard
            label="Projects"
            value={boardStats.totalProjects}
            helper="Total board projects"
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <NotificationDropdownCard
            title="Position notifications"
            description="Pedidos, clientes y estado de posiciones."
            unreadCount={positionNotificationGroups.unread.length}
            historyCount={positionNotificationGroups.read.length}
            isOpen={openNotificationPanel === "position"}
            onToggle={() =>
              setOpenNotificationPanel(
                openNotificationPanel === "position" ? null : "position"
              )
            }
            summary={[
              { label: "On hold", value: positionSummary.onHold },
              { label: "No candidates", value: positionSummary.noCandidates },
              { label: "Cancelled", value: positionSummary.cancelled },
              { label: "Hired", value: positionSummary.hired },
            ]}
          >
            <NotificationList
              unread={positionNotificationGroups.unread}
              read={positionNotificationGroups.read}
              currentUserId={currentUser.id}
              locallyReadNotificationIds={locallyReadNotificationIds}
              onNotificationClick={(notification) =>
                openPositionNotification(notification as PositionNotification)
              }
              emptyMessage="No position notifications for this user."
            />
          </NotificationDropdownCard>

          <NotificationDropdownCard
            title="Candidate notifications"
            description="Proceso, resume, aging y talento interno."
            unreadCount={candidateNotificationGroups.unread.length}
            historyCount={candidateNotificationGroups.read.length}
            isOpen={openNotificationPanel === "candidate"}
            onToggle={() =>
              setOpenNotificationPanel(
                openNotificationPanel === "candidate" ? null : "candidate"
              )
            }
            summary={[
              { label: "Aging", value: candidateSummary.aging },
              { label: "No resume", value: candidateSummary.resumeMissing },
              { label: "WIP", value: candidateSummary.resumeWip },
              { label: "Ready", value: candidateSummary.readyToPresent },
              { label: "Internal", value: candidateSummary.trickInternal },
            ]}
          >
            <NotificationList
              unread={candidateNotificationGroups.unread}
              read={candidateNotificationGroups.read}
              currentUserId={currentUser.id}
              locallyReadNotificationIds={locallyReadNotificationIds}
              onNotificationClick={(notification) =>
                openCandidateNotification(notification as CandidateNotification)
              }
              emptyMessage="No candidate notifications assigned to this user."
            />
          </NotificationDropdownCard>
        </div>

        <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  activeFilter === filter.key
                    ? "border-violet-500 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500/25 dark:text-white"
                    : "app-border app-card text-zinc-950 hover:bg-black/[0.04] dark:text-zinc-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-10 w-full min-w-[260px] items-center gap-2 rounded-xl border px-3 app-border app-card xl:w-[380px]">
              <Search className="h-4 w-4 app-text-muted" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar proyecto, posición o candidato..."
                className="w-full bg-transparent text-sm outline-none app-text-primary placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              />
            </div>

            <button className="flex h-10 items-center gap-2 rounded-xl border px-3 text-sm transition app-border app-card app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </div>
      </section>

      <section className="flex-1 overflow-x-auto overflow-y-hidden">
        {visibleProjects.length > 0 ? (
          <div className="flex h-full gap-4 p-6">
            {visibleProjects.map((project) => (
              <ProjectColumn
                key={project.id}
                project={project}
                onProjectClick={() =>
                  setSelectedDetail({
                    project,
                    position: null,
                    candidate: null,
                  })
                }
                onPositionClick={(position) =>
                  setSelectedDetail({
                    project,
                    position,
                    candidate: null,
                  })
                }
                onCandidateClick={(candidate, position) =>
                  setSelectedDetail({
                    project,
                    position,
                    candidate,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full min-h-[420px] items-center justify-center p-6">
            <div className="max-w-md rounded-2xl border p-8 text-center shadow-sm app-border app-card">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100">
                <Search className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-base font-semibold app-text-primary">
                No hay proyectos para mostrar
              </h3>

              <p className="mt-2 text-sm leading-6 app-text-secondary">
                Probá cambiar el filtro activo o ajustar la búsqueda por
                cliente, proyecto, posición o candidato.
              </p>

              <button
                onClick={() => {
                  setActiveFilter("all");
                  setSearch("");
                }}
                className="mt-4 rounded-xl px-4 py-2 text-sm font-medium app-button-primary"
              >
                Ver todos
              </button>
            </div>
          </div>
        )}
      </section>

      {selectedDetail && (
        <ResourcePlanningDetailModal
          project={selectedDetail.project}
          initialPosition={selectedDetail.position}
          initialCandidate={selectedDetail.candidate}
          onClose={() => setSelectedDetail(null)}
          onCandidateUpdate={handleCandidateUpdate}
          onPositionUpdate={handlePositionUpdate}
          onProjectUpdate={handleProjectUpdate}
        />
      )}

      {createModal && (
        <ResourcePlanningCreateModal
          mode={createModal.mode}
          project={createModal.project}
          position={createModal.position}
          onClose={() => setCreateModal(null)}
          onCreateProject={handleCreateProject}
          onCreatePosition={handleCreatePosition}
          onCreateCandidate={handleCreateCandidate}
        />
      )}
    </main>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  helper: string;
};

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm app-border app-card">
      <p className="text-sm app-text-secondary">{label}</p>

      <p className="mt-2 text-2xl font-semibold app-text-primary">{value}</p>

      <p className="mt-1 text-xs app-text-muted">{helper}</p>
    </div>
  );
}

type NotificationDropdownCardProps = {
  title: string;
  description: string;
  unreadCount: number;
  historyCount: number;
  isOpen: boolean;
  onToggle: () => void;
  summary: Array<{
    label: string;
    value: number;
  }>;
  children: ReactNode;
};

function NotificationDropdownCard({
  title,
  description,
  unreadCount,
  historyCount,
  isOpen,
  onToggle,
  summary,
  children,
}: NotificationDropdownCardProps) {
  return (
    <div className="rounded-2xl border shadow-sm app-border app-card">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-4 text-left transition hover:bg-black/[0.025] dark:hover:bg-white/[0.035]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold app-text-primary">
                {title}
              </h2>

              <p className="mt-1 text-sm app-text-secondary">{description}</p>
            </div>

            <div
              className={`shrink-0 rounded-xl border p-2 transition app-border app-text-secondary ${
                isOpen ? "rotate-180" : ""
              }`}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <NotificationCounter
              icon={<BellDot className="h-4 w-4" />}
              label="Pending"
              value={unreadCount}
              tone="pending"
            />

            <NotificationCounter
              icon={<History className="h-4 w-4" />}
              label="History"
              value={historyCount}
              tone="history"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {summary.map((item, index) => (
              <span
                key={item.label}
                className="text-zinc-700 dark:text-zinc-300"
              >
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {item.label}
                </span>{" "}
                <span className="font-semibold text-zinc-950 dark:text-zinc-100">
                  {item.value}
                </span>
                {index < summary.length - 1 && (
                  <span className="ml-2 text-zinc-400 dark:text-zinc-600">
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      </button>

      {isOpen && <div className="border-t p-4 app-border">{children}</div>}
    </div>
  );
}

type NotificationCounterProps = {
  icon: ReactNode;
  label: string;
  value: number;
  tone: "pending" | "history";
};

function NotificationCounter({
  icon,
  label,
  value,
  tone,
}: NotificationCounterProps) {
  const toneClassName =
    tone === "pending"
      ? "text-violet-700 dark:text-violet-300"
      : "text-zinc-600 dark:text-zinc-400";

  return (
    <div className="flex items-center gap-2">
      <span className={toneClassName}>{icon}</span>

      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
        {label}
      </span>

      <span
        className={`text-lg font-semibold leading-none ${
          tone === "pending"
            ? "text-zinc-950 dark:text-zinc-50"
            : "text-zinc-700 dark:text-zinc-300"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

type NotificationListProps = {
  unread: ResourcePlanningNotification[];
  read: ResourcePlanningNotification[];
  currentUserId: string;
  locallyReadNotificationIds: string[];
  onNotificationClick: (notification: ResourcePlanningNotification) => void;
  emptyMessage: string;
};

function NotificationList({
  unread,
  read,
  currentUserId,
  locallyReadNotificationIds,
  onNotificationClick,
  emptyMessage,
}: NotificationListProps) {
  if (unread.length === 0 && read.length === 0) {
    return <EmptyNotificationList message={emptyMessage} />;
  }

  return (
    <div className="max-h-[360px] space-y-5 overflow-y-auto pr-1">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <BellDot className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Unread / Pending
          </p>
        </div>

        {unread.length > 0 ? (
          <div className="space-y-2">
            {unread.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                read={false}
                currentUserId={currentUserId}
                locallyReadNotificationIds={locallyReadNotificationIds}
                onClick={() => onNotificationClick(notification)}
              />
            ))}
          </div>
        ) : (
          <EmptyNotificationList message="No unread notifications." compact />
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Read / History
          </p>
        </div>

        {read.length > 0 ? (
          <div className="space-y-2">
            {read.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                read
                currentUserId={currentUserId}
                locallyReadNotificationIds={locallyReadNotificationIds}
                onClick={() => onNotificationClick(notification)}
              />
            ))}
          </div>
        ) : (
          <EmptyNotificationList message="No history yet." compact />
        )}
      </div>
    </div>
  );
}

type NotificationListItemProps = {
  notification: ResourcePlanningNotification;
  read: boolean;
  currentUserId: string;
  locallyReadNotificationIds: string[];
  onClick: () => void;
};

function NotificationListItem({
  notification,
  read,
  currentUserId,
  locallyReadNotificationIds,
  onClick,
}: NotificationListItemProps) {
  const actuallyRead = isNotificationRead(
    notification,
    currentUserId,
    locallyReadNotificationIds
  );

  const finalRead = read || actuallyRead;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-2xl border p-3 text-left transition hover:scale-[1.005] hover:shadow-sm ${notificationClassName(
        notification.severity,
        finalRead
      )}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <NotificationIcon icon={notification.icon} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{notification.title}</p>

            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                finalRead
                  ? "border-zinc-300 bg-white text-zinc-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
                  : "border-violet-500 bg-violet-100 text-zinc-950 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-100"
              }`}
            >
              {finalRead ? "Read" : "Unread"}
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-sm leading-5">
            {notification.description}
          </p>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            <span>Event date: {notification.eventDate}</span>

            <span>
              {notification.project.clientName} ·{" "}
              {notification.position.title}
              {notification.type === "candidate"
                ? ` · ${notification.candidate.name}`
                : ""}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyNotificationList({
  message,
  compact = false,
}: {
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-dashed text-center text-sm app-border app-text-muted ${
        compact ? "px-3 py-4" : "px-3 py-6"
      }`}
    >
      {message}
    </div>
  );
}