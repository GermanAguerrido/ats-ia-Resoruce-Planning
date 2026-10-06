"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import type {
  CandidateProcessStatus,
  CandidateResumeStatus,
  CandidateTalentType,
  PositionCard as PositionCardType,
  ProjectColumn as ProjectColumnType,
  ProjectStatus,
} from "@/app/data/resourcePlanningMock";

type ProjectPriority = ProjectColumnType["priority"];

export type CreateEntityMode = "project" | "position" | "candidate";

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
  quantity: number;
  owner: string;
  status: "open" | "on_hold";
  jd: string;
};

export type NewCandidatePayload = {
  name: string;
  role: string;
  location: string;
  englishLevel: string;
  email: string;
  linkedin: string;
  portfolio: string;
  salaryCurrent: string;
  salaryExpected: string;
  workRelation: string;
  source: string;
  recruiterOwner: string;
  processStatus: CandidateProcessStatus;
  resumeStatus: CandidateResumeStatus;
  talentType: CandidateTalentType;
  notes: string;
};

type Props = {
  mode: CreateEntityMode;
  project?: ProjectColumnType | null;
  position?: PositionCardType | null;
  projects?: ProjectColumnType[];
  onClose: () => void;
  onCreateProject: (payload: NewProjectPayload) => void;
  onCreatePosition: (projectId: string, payload: NewPositionPayload) => void;
  onCreateCandidate: (
    projectId: string,
    positionId: string,
    payload: NewCandidatePayload
  ) => void;
};

const OWNER_OPTIONS = ["Ana", "Germán", "Sofía"];
const SENIORITY_OPTIONS = ["JR", "SSR", "SR", "Lead"];
const ENGLISH_OPTIONS = [
  "",
  "Basic",
  "Basic / Intermediate",
  "Intermediate",
  "Intermediate / Advanced",
  "Advanced",
  "Native",
];
const SOURCE_OPTIONS = ["LinkedIn", "Referral", "Trello import", "Other"];

const PRIORITY_OPTIONS: Array<{ value: ProjectPriority; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const PROJECT_STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: "active_search", label: "Active search" },
  { value: "coming_soon", label: "Coming soon" },
  { value: "active_no_search", label: "No open searches" },
  { value: "inactive", label: "Inactive" },
];

const PROCESS_STATUS_OPTIONS: Array<{
  value: CandidateProcessStatus;
  label: string;
}> = [
  { value: "sourced", label: "Sourced" },
  { value: "contacted", label: "Contacted" },
  { value: "screening", label: "Screening" },
  { value: "presented", label: "Presented" },
  { value: "tech_interview", label: "Tech Interview" },
];

const RESUME_STATUS_OPTIONS: Array<{
  value: CandidateResumeStatus;
  label: string;
}> = [
  { value: "none", label: "No resume" },
  { value: "wip_resume", label: "WIP resume" },
  { value: "resume_ready", label: "Resume ready" },
];

const TALENT_TYPE_OPTIONS: Array<{
  value: CandidateTalentType;
  label: string;
}> = [
  { value: "external", label: "External" },
  { value: "internal_candidate", label: "Internal candidate" },
  { value: "trick_internal", label: "Trick internal" },
];

const inputClass =
  "w-full rounded-xl border px-3 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 app-input";

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold app-text-secondary">
        {label}
        {required && <span className="ml-0.5 text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function FormSection({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide app-text-muted first:mt-1">
      {children}
    </p>
  );
}

function FormFooter({
  canSubmit,
  submitLabel,
  onCancel,
}: {
  canSubmit: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 border-t px-6 py-4 app-border">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border px-4 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={!canSubmit}
        style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
        className="rounded-xl px-5 py-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}

function ProjectForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: NewProjectPayload) => void;
  onCancel: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<ProjectPriority>("medium");
  const [status, setStatus] = useState<ProjectStatus>("active_search");
  const [confidential, setConfidential] = useState(false);

  const canSubmit = Boolean(clientName.trim() && projectName.trim());

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      clientName: clientName.trim(),
      projectName: projectName.trim(),
      description: description.trim(),
      priority,
      status,
      confidential,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-h-[62vh] overflow-y-auto px-6 pb-3">
        <FormSection>Project</FormSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Client name" required>
            <input
              autoFocus
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Example: Tiki Games"
              className={inputClass}
            />
          </Field>

          <Field label="Project name" required>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Example: Live Game Operations"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Brief description of the project and the recruiting demand..."
              className={`${inputClass} min-h-[76px] resize-y`}
            />
          </Field>
        </div>

        <FormSection>Settings</FormSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Priority">
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as ProjectPriority)}
              className={inputClass}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              className={inputClass}
            >
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 app-border">
          <span>
            <span className="block text-sm font-medium app-text-primary">
              Confidential project
            </span>
            <span className="block text-xs app-text-muted">
              Only people with access can see its details
            </span>
          </span>

          <input
            type="checkbox"
            checked={confidential}
            onChange={(event) => setConfidential(event.target.checked)}
            className="h-4 w-4 accent-violet-600"
          />
        </label>

        <p className="mt-3 text-xs app-text-muted">
          The cover is generated automatically. You can change it later from the
          project view.
        </p>
      </div>

      <FormFooter canSubmit={canSubmit} submitLabel="Create project" onCancel={onCancel} />
    </form>
  );
}

function PositionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: NewPositionPayload) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [seniority, setSeniority] = useState("SR");
  const [quantity, setQuantity] = useState("1");
  const [owner, setOwner] = useState(OWNER_OPTIONS[0]);
  const [status, setStatus] = useState<"open" | "on_hold">("open");
  const [jd, setJd] = useState("");

  const canSubmit = Boolean(title.trim());

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit({
      title: title.trim(),
      seniority,
      quantity: Math.max(1, Math.floor(Number(quantity)) || 1),
      owner,
      status,
      jd,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-h-[62vh] overflow-y-auto px-6 pb-3">
        <FormSection>Position</FormSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title" required>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Unity Engineer"
              className={inputClass}
            />
          </Field>

          <Field label="Seniority">
            <select
              value={seniority}
              onChange={(event) => setSeniority(event.target.value)}
              className={inputClass}
            >
              {SENIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Openings to fill">
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Owner">
            <select
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              className={inputClass}
            >
              {OWNER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-3 space-y-3">
          <Field label="Status">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as "open" | "on_hold")}
              className={inputClass}
            >
              <option value="open">Open</option>
              <option value="on_hold">On hold</option>
            </select>
          </Field>

          <Field label="JD / client request (optional)">
            <textarea
              value={jd}
              onChange={(event) => setJd(event.target.value)}
              placeholder="Paste the JD or the instructions from the client..."
              className={`${inputClass} min-h-[96px] resize-y`}
            />
          </Field>
        </div>

        <p className="mt-3 text-xs app-text-muted">
          The JD is saved in the position and can be edited later with formatting.
        </p>
      </div>

      <FormFooter canSubmit={canSubmit} submitLabel="Add position" onCancel={onCancel} />
    </form>
  );
}

type CandidateTarget = { projectId: string; positionId: string };

function CandidateForm({
  initialRole = "",
  projects,
  onSubmit,
  onCancel,
}: {
  initialRole?: string;
  projects?: ProjectColumnType[];
  onSubmit: (payload: NewCandidatePayload, target: CandidateTarget | null) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [roleOverride, setRoleOverride] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(projects?.[0]?.id ?? "");
  const [selectedPositionId, setSelectedPositionId] = useState("");

  // Con selector (listado de candidatos): la posición y el rol por defecto salen de lo elegido
  const selectedProject = projects?.find((project) => project.id === selectedProjectId);
  const selectedPosition =
    selectedProject?.positions.find((position) => position.id === selectedPositionId) ??
    selectedProject?.positions[0];
  const role = roleOverride ?? (projects ? (selectedPosition?.title ?? "") : initialRole);
  const setRole = (value: string) => setRoleOverride(value);
  const [location, setLocation] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [salaryCurrent, setSalaryCurrent] = useState("");
  const [salaryExpected, setSalaryExpected] = useState("");
  const [workRelation, setWorkRelation] = useState("");
  const [source, setSource] = useState(SOURCE_OPTIONS[0]);
  const [recruiterOwner, setRecruiterOwner] = useState(OWNER_OPTIONS[0]);
  const [processStatus, setProcessStatus] =
    useState<CandidateProcessStatus>("sourced");
  const [resumeStatus, setResumeStatus] = useState<CandidateResumeStatus>("none");
  const [talentType, setTalentType] = useState<CandidateTalentType>("external");
  const [notes, setNotes] = useState("");

  const canSubmit = Boolean(
    name.trim() && role.trim() && (!projects || selectedPosition)
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    onSubmit(
      {
      name: name.trim(),
      role: role.trim(),
      location: location.trim(),
      englishLevel,
      email: email.trim(),
      linkedin: linkedin.trim(),
      portfolio: portfolio.trim(),
      salaryCurrent: salaryCurrent.trim(),
      salaryExpected: salaryExpected.trim(),
      workRelation: workRelation.trim(),
      source,
      recruiterOwner,
      processStatus,
      resumeStatus,
      talentType,
      notes: notes.trim(),
      },
      projects && selectedProject && selectedPosition
        ? { projectId: selectedProject.id, positionId: selectedPosition.id }
        : null
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-h-[62vh] overflow-y-auto px-6 pb-3">
        {projects && (
          <>
            <FormSection>Placement</FormSection>

            {projects.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Project" required>
                  <select
                    value={selectedProject?.id ?? ""}
                    onChange={(event) => {
                      setSelectedProjectId(event.target.value);
                      setSelectedPositionId("");
                    }}
                    className={inputClass}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.projectName} · {project.clientName}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Position" required>
                  <select
                    value={selectedPosition?.id ?? ""}
                    onChange={(event) => setSelectedPositionId(event.target.value)}
                    className={inputClass}
                  >
                    {(selectedProject?.positions ?? []).map((position) => (
                      <option key={position.id} value={position.id}>
                        {position.title} · {position.seniority}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed px-3 py-4 text-sm app-border app-text-muted">
                There are no positions yet. Create a position in Resource Planning
                first, then add candidates to it.
              </p>
            )}
          </>
        )}

        <FormSection>Basic</FormSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name" required>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Juan Pérez"
              className={inputClass}
            />
          </Field>

          <Field label="Role" required>
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Role"
              className={inputClass}
            />
          </Field>

          <Field label="Location">
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Argentina"
              className={inputClass}
            />
          </Field>

          <Field label="English level">
            <select
              value={englishLevel}
              onChange={(event) => setEnglishLevel(event.target.value)}
              className={inputClass}
            >
              {ENGLISH_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option || "Not defined"}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <FormSection>Contact &amp; links</FormSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Mail">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@email.com"
              className={inputClass}
            />
          </Field>

          <Field label="LinkedIn">
            <input
              value={linkedin}
              onChange={(event) => setLinkedin(event.target.value)}
              placeholder="linkedin.com/in/..."
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Portfolio">
            <input
              value={portfolio}
              onChange={(event) => setPortfolio(event.target.value)}
              placeholder="github.com/... or personal site"
              className={inputClass}
            />
          </Field>
        </div>

        <FormSection>Compensation</FormSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Current salary">
            <input
              value={salaryCurrent}
              onChange={(event) => setSalaryCurrent(event.target.value)}
              placeholder="USD 3.500"
              className={inputClass}
            />
          </Field>

          <Field label="Expected salary">
            <input
              value={salaryExpected}
              onChange={(event) => setSalaryExpected(event.target.value)}
              placeholder="USD 4.500"
              className={inputClass}
            />
          </Field>

          <Field label="Work relation">
            <input
              list="rp-work-relation-options"
              value={workRelation}
              onChange={(event) => setWorkRelation(event.target.value)}
              placeholder="Contractor, Relación de dependencia..."
              className={inputClass}
            />
            <datalist id="rp-work-relation-options">
              <option value="Contractor" />
              <option value="Relación de dependencia" />
              <option value="Freelance" />
            </datalist>
          </Field>

          <Field label="Source">
            <select
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className={inputClass}
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <FormSection>Process</FormSection>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Recruiter owner">
            <select
              value={recruiterOwner}
              onChange={(event) => setRecruiterOwner(event.target.value)}
              className={inputClass}
            >
              {OWNER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Process status">
            <select
              value={processStatus}
              onChange={(event) =>
                setProcessStatus(event.target.value as CandidateProcessStatus)
              }
              className={inputClass}
            >
              {PROCESS_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Resume status">
            <select
              value={resumeStatus}
              onChange={(event) =>
                setResumeStatus(event.target.value as CandidateResumeStatus)
              }
              className={inputClass}
            >
              {RESUME_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Talent type">
            <select
              value={talentType}
              onChange={(event) =>
                setTalentType(event.target.value as CandidateTalentType)
              }
              className={inputClass}
            >
              {TALENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-3">
          <Field label="HR notes (optional)">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Context, availability, impressions..."
              className={`${inputClass} min-h-[76px] resize-y`}
            />
          </Field>
        </div>
      </div>

      <FormFooter canSubmit={canSubmit} submitLabel="Add candidate" onCancel={onCancel} />
    </form>
  );
}

export function CreateEntityModal({
  mode,
  project = null,
  position = null,
  projects,
  onClose,
  onCreateProject,
  onCreatePosition,
  onCreateCandidate,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const title =
    mode === "project"
      ? "New project"
      : mode === "position"
        ? "Add position"
        : "Add candidate";

  const subtitle =
    mode === "project"
      ? "Creates a new column on the board"
      : mode === "position" && project
        ? `${project.projectName} · ${project.clientName}`
        : mode === "candidate" && project && position
          ? `${project.projectName} · ${position.title} · ${position.seniority}`
          : mode === "candidate" && projects
            ? "Choose the project and position, then complete the data"
            : "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/65 px-4 py-10 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-[660px] overflow-hidden rounded-2xl border shadow-2xl app-border app-card"
      >
        <div className="h-1.5 bg-gradient-to-r from-violet-600 via-violet-400 to-blue-500" />

        <header className="flex items-start justify-between gap-3 px-6 pb-2 pt-5">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold app-text-primary">{title}</h2>

            {subtitle && (
              <p className="mt-1 text-sm app-text-muted">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {mode === "project" && (
          <ProjectForm
            onCancel={onClose}
            onSubmit={(payload) => {
              onCreateProject(payload);
              onClose();
            }}
          />
        )}

        {mode === "position" && project && (
          <PositionForm
            onCancel={onClose}
            onSubmit={(payload) => {
              onCreatePosition(project.id, payload);
              onClose();
            }}
          />
        )}

        {mode === "candidate" && project && position && (
          <CandidateForm
            initialRole={position.title}
            onCancel={onClose}
            onSubmit={(payload) => {
              onCreateCandidate(project.id, position.id, payload);
              onClose();
            }}
          />
        )}

        {mode === "candidate" && !position && projects && (
          <CandidateForm
            projects={projects}
            onCancel={onClose}
            onSubmit={(payload, target) => {
              if (target) {
                onCreateCandidate(target.projectId, target.positionId, payload);
              }

              onClose();
            }}
          />
        )}
      </article>
    </div>
  );
}