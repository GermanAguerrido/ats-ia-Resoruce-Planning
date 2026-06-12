"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquare,
  UserRound,
  Users,
  X,
} from "lucide-react";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
  ProjectColumn as ProjectColumnType,
} from "@/app/data/resourcePlanningMock";
import { CandidateMiniCard } from "./CandidateMiniCard";

type Props = {
  project: ProjectColumnType;
  position: PositionCardType;
  onClose: () => void;
  onCandidateClick: (candidate: CandidateMini) => void;
};

const statusConfig = {
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

export function PositionDetailDrawer({
  project,
  position,
  onClose,
  onCandidateClick,
}: Props) {
  const config = statusConfig[position.status];

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l shadow-2xl app-border app-card">
      <div className={`h-1.5 ${config.barClass}`} />

      <header className="flex items-start justify-between gap-4 border-b p-5 app-border">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rp-board-badge rounded-full border px-2.5 py-1 text-xs font-semibold ${config.badgeClass}`}
            >
              {config.label}
            </span>

            <span className="rp-status-badge rounded-full px-2.5 py-1 text-xs font-semibold">
              {project.clientName}
            </span>
          </div>

          <h2 className="text-xl font-semibold app-text-primary">
            {position.title}
          </h2>

          <p className="mt-1 text-sm app-text-secondary">
            {position.seniority} · {project.projectName}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-xl border p-2 transition app-border app-text-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          aria-label="Close drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border p-4 app-border bg-black/[0.025] dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 app-text-secondary">
              <UserRound className="h-4 w-4" />
              <span className="text-xs font-medium">Owner</span>
            </div>

            <p className="mt-2 text-sm font-semibold app-text-primary">
              {position.owner}
            </p>
          </div>

          <div className="rounded-2xl border p-4 app-border bg-black/[0.025] dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 app-text-secondary">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Candidates linked</span>
            </div>

            <p className="mt-2 text-sm font-semibold app-text-primary">
              {position.candidates.length}
            </p>
          </div>

          <div className="rounded-2xl border p-4 app-border bg-black/[0.025] dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 app-text-secondary">
              <BriefcaseBusiness className="h-4 w-4" />
              <span className="text-xs font-medium">Seniority</span>
            </div>

            <p className="mt-2 text-sm font-semibold app-text-primary">
              {position.seniority}
            </p>
          </div>

          <div className="rounded-2xl border p-4 app-border bg-black/[0.025] dark:bg-white/[0.035]">
            <div className="flex items-center gap-2 app-text-secondary">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Current status</span>
            </div>

            <p className="mt-2 text-sm font-semibold app-text-primary">
              {config.label}
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-4 app-border app-card">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="h-4 w-4 app-text-secondary" />
            <h3 className="text-sm font-semibold app-text-primary">
              Position brief / JD
            </h3>
          </div>

          <div className="mt-4 space-y-3 text-sm leading-6 app-text-secondary">
            <p>
              Esta sección va a contener la JD completa o las instrucciones del
              pedido solicitado por el cliente.
            </p>

            <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
              <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                Base role
              </p>
              <p className="mt-1 app-text-primary">
                {position.title} · {position.seniority}
              </p>
            </div>

            <div className="rounded-xl border p-3 app-border bg-black/[0.025] dark:bg-white/[0.035]">
              <p className="text-xs font-semibold uppercase tracking-wide app-text-muted">
                Client / Project
              </p>
              <p className="mt-1 app-text-primary">
                {project.clientName} · {project.projectName}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-4 app-border app-card">
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

          <div className="mt-4 space-y-2">
            {position.candidates.length > 0 ? (
              position.candidates.map((candidate) => (
                <CandidateMiniCard
                  key={candidate.id}
                  candidate={candidate}
                  onClick={() => onCandidateClick(candidate)}
                />
              ))
            ) : (
              <div className="rounded-xl border border-dashed px-3 py-5 text-center text-sm app-border app-text-muted">
                No candidates linked yet.
              </div>
            )}
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
                  position to Resource Planning.
                </p>
                <p className="mt-1 text-xs app-text-muted">
                  Initial activity · mock
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="rp-avatar-badge flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                AJ
              </div>

              <div>
                <p className="text-sm app-text-primary">
                  <span className="font-semibold">Ana</span> reviewed candidate
                  allocation for this role.
                </p>
                <p className="mt-1 text-xs app-text-muted">
                  Activity preview · mock
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border p-4 app-border app-card">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 app-text-secondary" />
            <h3 className="text-sm font-semibold app-text-primary">
              Next layer preview
            </h3>
          </div>

          <div className="mt-4 space-y-3 text-sm app-text-secondary">
            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p>Agregar JD real editable.</p>
            </div>

            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p>Agregar comentarios reales por posición.</p>
            </div>

            <div className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p>Agregar candidato a posición sin duplicar Candidate ID.</p>
            </div>
          </div>
        </section>
      </div>
    </aside>
  );
}