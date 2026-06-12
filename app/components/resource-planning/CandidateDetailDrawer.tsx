"use client";

import {
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  FileText,
  LinkIcon,
  Mail,
  MapPin,
  MessageSquare,
  UserRound,
  X,
} from "lucide-react";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
  ProjectColumn as ProjectColumnType,
} from "@/app/data/resourcePlanningMock";

type Props = {
  candidate: CandidateMini;
  project: ProjectColumnType;
  position: PositionCardType;
  onClose: () => void;
};

const candidateStatusConfig = {
  contacted: {
    label: "Contacted",
    className: "rp-candidate-contacted",
  },
  resume: {
    label: "Resume",
    className: "rp-candidate-resume",
  },
  wip_resume: {
    label: "WIP Resume",
    className: "rp-candidate-wip-resume",
  },
  approved: {
    label: "Approved",
    className: "rp-candidate-approved",
  },
  tech_interview: {
    label: "Tec Int.",
    className: "rp-candidate-tech-interview",
  },
  interviewed: {
    label: "Interviewed",
    className: "rp-candidate-interviewed",
  },
  hired: {
    label: "Hired",
    className: "rp-candidate-hired",
  },
  trick_internal: {
    label: "Trick Internal",
    className: "rp-candidate-trick-internal",
  },
};

export function CandidateDetailDrawer({
  candidate,
  project,
  position,
  onClose,
}: Props) {
  return (
    <aside className="fixed inset-y-0 right-0 z-[60] flex w-full max-w-[560px] flex-col border-l shadow-2xl app-border app-card">
      <div className="h-1.5 bg-violet-500" />

      <header className="flex items-start justify-between gap-4 border-b p-5 app-border">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {candidate.status.map((status) => {
              const config = candidateStatusConfig[status];

              return (
                <span
                  key={status}
                  className={`rp-candidate-badge rounded-md px-2 py-1 text-[11px] font-semibold ${config.className}`}
                >
                  {config.label}
                </span>
              );
            })}
          </div>

          <h2 className="text-xl font-semibold app-text-primary">
            {candidate.name} - {position.title} / {position.seniority}
          </h2>

          <p className="mt-1 text-sm app-text-secondary">
            {candidate.location} · Candidate ID: {candidate.id}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          aria-label="Close candidate drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <section className="rounded-2xl border p-4 app-border app-card">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 app-text-secondary" />
            <h3 className="text-sm font-semibold app-text-primary">
              Candidate overview
            </h3>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
              <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                Role
              </p>
              <p className="mt-1 text-sm font-medium app-text-primary">
                {candidate.role}
              </p>
            </div>

            <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
              <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                Location
              </p>
              <p className="mt-1 text-sm font-medium app-text-primary">
                {candidate.location}
              </p>
            </div>

            <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
              <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                Source
              </p>
              <p className="mt-1 text-sm font-medium app-text-primary">
                {candidate.source || "Not defined"}
              </p>
            </div>

            <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
              <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                English
              </p>
              <p className="mt-1 text-sm font-medium app-text-primary">
                {candidate.englishLevel || "Not defined"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-4 app-border app-card">
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
              En esta capa el candidato se ve asignado a esta posición, pero su
              Candidate ID se mantiene único para evitar duplicaciones.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-4 app-border app-card">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 app-text-secondary" />
            <h3 className="text-sm font-semibold app-text-primary">
              Description
            </h3>
          </div>

          <div className="mt-4 space-y-3 text-sm app-text-secondary">
            <div className="flex items-start gap-2">
              <LinkIcon className="mt-0.5 h-4 w-4 shrink-0 app-text-muted" />
              <div>
                <p className="font-medium app-text-primary">LinkedIn</p>
                <p>{candidate.linkedin || "Not defined"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 app-text-muted" />
              <div>
                <p className="font-medium app-text-primary">Portfolio</p>
                <p>{candidate.portfolio || "Not defined"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 app-text-muted" />
              <div>
                <p className="font-medium app-text-primary">Mail</p>
                <p>{candidate.email || "Not defined"}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 app-text-muted" />
              <div>
                <p className="font-medium app-text-primary">Salary</p>
                <p>
                  Actual: {candidate.salaryCurrent || "Not defined"} ·
                  Pretendido: {candidate.salaryExpected || "Not defined"}
                </p>
              </div>
            </div>

            <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
              <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                Relación laboral
              </p>
              <p className="mt-1 app-text-primary">
                {candidate.workRelation || "Not defined"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-4 app-border app-card">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 app-text-secondary" />
            <h3 className="text-sm font-semibold app-text-primary">
              Comments and activity
            </h3>
          </div>

          <div className="mt-4">
            <textarea
              placeholder="Write a comment..."
              className="min-h-[90px] w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none app-border app-card app-text-primary placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />

            <button className="mt-2 rounded-xl px-4 py-2 text-sm font-medium app-button-primary">
              Comment
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex gap-3">
              <div className="rp-avatar-badge flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                GA
              </div>

              <div>
                <p className="text-sm app-text-primary">
                  <span className="font-semibold">Germán</span> added this
                  candidate to {position.title}.
                </p>
                <p className="mt-1 text-xs app-text-muted">
                  Candidate activity · mock
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="rp-avatar-badge flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                AJ
              </div>

              <div>
                <p className="text-sm app-text-primary">
                  <span className="font-semibold">Ana</span> updated candidate
                  status.
                </p>
                <p className="mt-1 text-xs app-text-muted">
                  Status update · mock
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-4 app-border app-card">
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
      </div>
    </aside>
  );
}