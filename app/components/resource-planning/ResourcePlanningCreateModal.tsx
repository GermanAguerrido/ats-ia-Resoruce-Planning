"use client";

import { useMemo, useState } from "react";
import { BriefcaseBusiness, Plus, UserRound, X } from "lucide-react";
import type {
  CandidateMini,
  CandidateProcessStatus,
  CandidateResumeStatus,
  CandidateTalentType,
  PositionCard as PositionCardType,
  ProjectColumn as ProjectColumnType,
  ProjectStatus,
} from "@/app/data/resourcePlanningMock";

type ProjectPriority = ProjectColumnType["priority"];
type PositionStatus = PositionCardType["status"];

export type CreateModalMode = "project" | "position" | "candidate";

export type NewProjectPayload = {
  clientName: string;
  projectName: string;
  description: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  confidential: boolean;
};

export type NewPositionPayload = {
  title: string;
  seniority: string;
  owner: string;
  status: PositionStatus;
};

export type NewCandidatePayload = {
  name: string;
  role: string;
  location: string;
  recruiterOwner: string;
  processStatus: CandidateProcessStatus;
  resumeStatus: CandidateResumeStatus;
  talentType: CandidateTalentType;
};

type Props = {
  mode: CreateModalMode;
  project?: ProjectColumnType | null;
  position?: PositionCardType | null;
  onClose: () => void;
  onCreateProject: (payload: NewProjectPayload) => void;
  onCreatePosition: (projectId: string, payload: NewPositionPayload) => void;
  onCreateCandidate: (
    projectId: string,
    positionId: string,
    payload: NewCandidatePayload
  ) => void;
};

const projectStatusOptions: Array<{
  value: ProjectStatus;
  label: string;
}> = [
  {
    value: "active_search",
    label: "Active search",
  },
  {
    value: "coming_soon",
    label: "Coming soon",
  },
  {
    value: "active_no_search",
    label: "Sin búsquedas activas",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
];

const projectPriorityOptions: Array<{
  value: ProjectPriority;
  label: string;
}> = [
  {
    value: "high",
    label: "High",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "low",
    label: "Low",
  },
];

const positionStatusOptions: Array<{
  value: PositionStatus;
  label: string;
}> = [
  {
    value: "open",
    label: "Open",
  },
  {
    value: "on_hold",
    label: "On hold",
  },
  {
    value: "hired",
    label: "Hired",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

const processStatusOptions: Array<{
  value: CandidateProcessStatus;
  label: string;
}> = [
  {
    value: "sourced",
    label: "Sourced",
  },
  {
    value: "contacted",
    label: "Contacted",
  },
  {
    value: "screening",
    label: "Screening",
  },
  {
    value: "presented",
    label: "Presented",
  },
  {
    value: "tech_interview",
    label: "Tech Interview",
  },
  {
    value: "client_interview",
    label: "Client Interview",
  },
  {
    value: "offer",
    label: "Offer",
  },
  {
    value: "hired",
    label: "Hired",
  },
  {
    value: "rejected",
    label: "Rejected",
  },
  {
    value: "stand_by",
    label: "Stand by",
  },
];

const resumeStatusOptions: Array<{
  value: CandidateResumeStatus;
  label: string;
}> = [
  {
    value: "none",
    label: "No Resume",
  },
  {
    value: "wip_resume",
    label: "WIP Resume",
  },
  {
    value: "resume_ready",
    label: "Resume Ready",
  },
];

const talentTypeOptions: Array<{
  value: CandidateTalentType;
  label: string;
}> = [
  {
    value: "external",
    label: "External",
  },
  {
    value: "internal_candidate",
    label: "Internal Candidate",
  },
  {
    value: "trick_internal",
    label: "Trick Internal",
  },
];

function getModalCopy(mode: CreateModalMode) {
  if (mode === "project") {
    return {
      title: "New project",
      description:
        "Create a new client project to organize positions and candidate allocation.",
      icon: BriefcaseBusiness,
    };
  }

  if (mode === "position") {
    return {
      title: "Add position",
      description:
        "Create a new role inside the selected project and assign an internal owner.",
      icon: Plus,
    };
  }

  return {
    title: "Add candidate",
    description:
      "Create a candidate linked to the selected position with structured recruiting status.",
    icon: UserRound,
  };
}

export function ResourcePlanningCreateModal({
  mode,
  project = null,
  position = null,
  onClose,
  onCreateProject,
  onCreatePosition,
  onCreateCandidate,
}: Props) {
  const copy = useMemo(() => getModalCopy(mode), [mode]);
  const Icon = copy.icon;

  const [projectClientName, setProjectClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectPriority, setProjectPriority] =
    useState<ProjectPriority>("medium");
  const [projectStatus, setProjectStatus] =
    useState<ProjectStatus>("active_search");
  const [projectConfidential, setProjectConfidential] = useState(false);

  const [positionTitle, setPositionTitle] = useState("");
  const [positionSeniority, setPositionSeniority] = useState("SR");
  const [positionOwner, setPositionOwner] = useState("Germán");
  const [positionStatus, setPositionStatus] =
    useState<PositionStatus>("open");

  const [candidateName, setCandidateName] = useState("");
  const [candidateRole, setCandidateRole] = useState("");
  const [candidateLocation, setCandidateLocation] = useState("Argentina");
  const [candidateRecruiterOwner, setCandidateRecruiterOwner] =
    useState("Germán");
  const [candidateProcessStatus, setCandidateProcessStatus] =
    useState<CandidateProcessStatus>("contacted");
  const [candidateResumeStatus, setCandidateResumeStatus] =
    useState<CandidateResumeStatus>("none");
  const [candidateTalentType, setCandidateTalentType] =
    useState<CandidateTalentType>("external");

  const canSubmitProject =
    projectClientName.trim().length > 0 &&
    projectName.trim().length > 0 &&
    projectDescription.trim().length > 0;

  const canSubmitPosition =
    Boolean(project) &&
    positionTitle.trim().length > 0 &&
    positionSeniority.trim().length > 0 &&
    positionOwner.trim().length > 0;

  const canSubmitCandidate =
    Boolean(project) &&
    Boolean(position) &&
    candidateName.trim().length > 0 &&
    candidateRole.trim().length > 0 &&
    candidateLocation.trim().length > 0 &&
    candidateRecruiterOwner.trim().length > 0;

  const canSubmit =
    mode === "project"
      ? canSubmitProject
      : mode === "position"
        ? canSubmitPosition
        : canSubmitCandidate;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    if (mode === "project") {
      onCreateProject({
        clientName: projectClientName.trim(),
        projectName: projectName.trim(),
        description: projectDescription.trim(),
        priority: projectPriority,
        status: projectStatus,
        confidential: projectConfidential,
      });

      return;
    }

    if (mode === "position" && project) {
      onCreatePosition(project.id, {
        title: positionTitle.trim(),
        seniority: positionSeniority.trim(),
        owner: positionOwner.trim(),
        status: positionStatus,
      });

      return;
    }

    if (mode === "candidate" && project && position) {
      onCreateCandidate(project.id, position.id, {
        name: candidateName.trim(),
        role: candidateRole.trim(),
        location: candidateLocation.trim(),
        recruiterOwner: candidateRecruiterOwner.trim(),
        processStatus: candidateProcessStatus,
        resumeStatus: candidateResumeStatus,
        talentType: candidateTalentType,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <article
        className="w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl app-border app-card"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b px-5 py-4 app-border">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100">
              <Icon className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-semibold app-text-primary">
                {copy.title}
              </h2>

              <p className="mt-1 text-sm leading-6 app-text-secondary">
                {copy.description}
              </p>

              {mode !== "project" && project && (
                <p className="mt-2 text-xs app-text-muted">
                  Project: {project.clientName} · {project.projectName}
                </p>
              )}

              {mode === "candidate" && position && (
                <p className="mt-1 text-xs app-text-muted">
                  Position: {position.title} · {position.seniority}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            aria-label="Close create modal"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <main className="px-5 py-5">
          {mode === "project" && (
            <div className="grid gap-4">
              <FormField label="Client name">
                <input
                  value={projectClientName}
                  onChange={(event) => setProjectClientName(event.target.value)}
                  placeholder="Example: Tiki Games"
                  className="rp-create-input"
                />
              </FormField>

              <FormField label="Project name">
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="Example: Live Game Operations"
                  className="rp-create-input"
                />
              </FormField>

              <FormField label="Project description">
                <textarea
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(event.target.value)
                  }
                  placeholder="Brief description of the project, client context or recruiting demand..."
                  className="rp-create-input min-h-[96px] resize-none"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Priority">
                  <select
                    value={projectPriority}
                    onChange={(event) =>
                      setProjectPriority(event.target.value as ProjectPriority)
                    }
                    className="rp-create-input"
                  >
                    {projectPriorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Status">
                  <select
                    value={projectStatus}
                    onChange={(event) =>
                      setProjectStatus(event.target.value as ProjectStatus)
                    }
                    className="rp-create-input"
                  >
                    {projectStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-3 app-border app-card">
                <div>
                  <p className="text-sm font-medium app-text-primary">
                    Confidential project
                  </p>

                  <p className="mt-1 text-xs app-text-muted">
                    Use this for sensitive clients, hidden searches or restricted
                    visibility projects.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={projectConfidential}
                  onChange={(event) =>
                    setProjectConfidential(event.target.checked)
                  }
                  className="h-4 w-4 accent-violet-600"
                />
              </label>
            </div>
          )}

          {mode === "position" && (
            <div className="grid gap-4">
              <FormField label="Title">
                <input
                  value={positionTitle}
                  onChange={(event) => setPositionTitle(event.target.value)}
                  placeholder="Example: Unity Engineer"
                  className="rp-create-input"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="Seniority">
                  <input
                    value={positionSeniority}
                    onChange={(event) =>
                      setPositionSeniority(event.target.value)
                    }
                    placeholder="SR"
                    className="rp-create-input"
                  />
                </FormField>

                <FormField label="Owner">
                  <input
                    value={positionOwner}
                    onChange={(event) => setPositionOwner(event.target.value)}
                    placeholder="Germán"
                    className="rp-create-input"
                  />
                </FormField>

                <FormField label="Status">
                  <select
                    value={positionStatus}
                    onChange={(event) =>
                      setPositionStatus(event.target.value as PositionStatus)
                    }
                    className="rp-create-input"
                  >
                    {positionStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          )}

          {mode === "candidate" && (
            <div className="grid gap-4">
              <FormField label="Name">
                <input
                  value={candidateName}
                  onChange={(event) => setCandidateName(event.target.value)}
                  placeholder="Example: Juan Pérez"
                  className="rp-create-input"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Role">
                  <input
                    value={candidateRole}
                    onChange={(event) => setCandidateRole(event.target.value)}
                    placeholder="Example: Unity Engineer"
                    className="rp-create-input"
                  />
                </FormField>

                <FormField label="Location">
                  <input
                    value={candidateLocation}
                    onChange={(event) =>
                      setCandidateLocation(event.target.value)
                    }
                    placeholder="Argentina"
                    className="rp-create-input"
                  />
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Recruiter owner">
                  <input
                    value={candidateRecruiterOwner}
                    onChange={(event) =>
                      setCandidateRecruiterOwner(event.target.value)
                    }
                    placeholder="Germán"
                    className="rp-create-input"
                  />
                </FormField>

                <FormField label="Talent type">
                  <select
                    value={candidateTalentType}
                    onChange={(event) =>
                      setCandidateTalentType(
                        event.target.value as CandidateTalentType
                      )
                    }
                    className="rp-create-input"
                  >
                    {talentTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Process status">
                  <select
                    value={candidateProcessStatus}
                    onChange={(event) =>
                      setCandidateProcessStatus(
                        event.target.value as CandidateProcessStatus
                      )
                    }
                    className="rp-create-input"
                  >
                    {processStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Resume status">
                  <select
                    value={candidateResumeStatus}
                    onChange={(event) =>
                      setCandidateResumeStatus(
                        event.target.value as CandidateResumeStatus
                      )
                    }
                    className="rp-create-input"
                  >
                    {resumeStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
            </div>
          )}
        </main>

        <footer className="flex flex-col-reverse gap-2 border-t px-5 py-4 app-border sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm font-medium transition app-border app-card app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl px-4 py-2 text-sm font-medium app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mode === "project"
              ? "Create project"
              : mode === "position"
                ? "Create position"
                : "Create candidate"}
          </button>
        </footer>

        <style>{`
          .rp-create-input {
            width: 100%;
            border-radius: 0.75rem;
            border: 1px solid var(--app-border);
            background: var(--app-surface);
            color: var(--app-text-primary);
            padding: 0.625rem 0.75rem;
            font-size: 0.875rem;
            outline: none;
          }

          .rp-create-input::placeholder {
            color: var(--app-text-muted);
          }

          .rp-create-input:focus {
            border-color: #8b5cf6;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
          }
        `}</style>
      </article>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
};

function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide app-text-muted">
        {label}
      </span>

      {children}
    </label>
  );
}