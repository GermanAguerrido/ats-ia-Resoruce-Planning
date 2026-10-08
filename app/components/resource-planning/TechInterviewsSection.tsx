"use client";

import { useState } from "react";
import { Paperclip, Plus, Trash2 } from "lucide-react";

import type { CandidateMini, PositionCard } from "@/app/data/resourcePlanningMock";
import { normalizeSeniority } from "@/app/lib/candidateStatus";
import { canUndoMoves, useCurrentUser } from "@/app/lib/currentUser";
import {
  addTechInterview,
  removeTechInterview,
  summarizeTechInterview,
  useTechInterviews,
  type TechInterview,
} from "@/app/lib/techInterviews";
import { TechInterviewDialog } from "./TechInterviewForm";

type ChangeFn = (
  updates: Partial<CandidateMini>,
  activityText: string,
  timelineEntry?: { title: string; description: string }
) => void;

/**
 * Entrevistas técnicas internas del candidato: varias, con fecha, conclusiones de cada
 * entrevistador, evaluación de la transcripción y adjuntos. Sirven para todas sus posiciones.
 */
export function TechInterviewsSection({
  candidate,
  position,
  projectName,
  openSignal = 0,
  onChange,
}: {
  candidate: CandidateMini;
  position: PositionCard;
  projectName: string;
  // Sube cuando se pide agregar una entrevista desde una acción rápida
  openSignal?: number;
  onChange: ChangeFn;
}) {
  const list = useTechInterviews(candidate.id);
  const { user, role } = useCurrentUser();
  const [adding, setAdding] = useState(false);
  const [lastSignal, setLastSignal] = useState(openSignal);

  if (openSignal !== lastSignal) {
    setLastSignal(openSignal);
    setAdding(true);
  }

  const save = (interview: TechInterview) => {
    addTechInterview(candidate.id, interview);

    onChange(
      {
        seniority: interview.seniority,
        seniorityValidated: true,
        techInterviewDoneAt: interview.date,
      },
      `Recorded an internal tech interview (${summarizeTechInterview(interview)}).`,
      {
        title: "Internal tech interview",
        description: `Interview of ${interview.date}. Seniority validated as ${interview.seniority}.`,
      }
    );
  };

  return (
    <div className="space-y-3">
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-3 text-sm app-border app-text-muted">
          No internal tech interview yet. It is required to move the candidate to Tech Interview.
        </p>
      ) : (
        list.map((interview) => (
          <details
            key={interview.id}
            className="group rounded-xl border app-border app-card"
            open={list[0]?.id === interview.id}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
              <span className="text-sm font-semibold app-text-primary">{interview.date}</span>

              <span className="rounded-full border border-violet-500/40 px-2 py-0.5 text-xs font-semibold text-violet-500">
                {interview.seniority}
              </span>

              <span className="min-w-0 flex-1 truncate text-xs app-text-muted">
                {interview.opinions.map((item) => item.interviewer).join(", ")}
              </span>

              {canUndoMoves(role) && (
                <button
                  type="button"
                  aria-label="Delete tech interview"
                  title="Delete (Talent / Admin)"
                  onClick={(event) => {
                    event.preventDefault();
                    removeTechInterview(candidate.id, interview.id);
                  }}
                  className="app-text-muted hover:opacity-80"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </summary>

            <div className="space-y-3 border-t px-4 py-3 text-sm app-border">
              {interview.opinions.map((opinion, index) => (
                <div key={index}>
                  <p className="text-xs font-semibold app-text-secondary">
                    {opinion.interviewer}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap leading-6 app-text-primary">
                    {opinion.text}
                  </p>
                </div>
              ))}

              {interview.aiEvaluation && (
                <div className="rounded-lg border px-3 py-2 app-border">
                  <p className="text-xs font-semibold app-text-secondary">
                    AI evaluation from the transcript
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-xs leading-5 app-text-secondary">
                    {interview.aiEvaluation}
                  </p>
                </div>
              )}

              {interview.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interview.attachments.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs app-border app-text-secondary"
                    >
                      <Paperclip className="h-3 w-3" />
                      {name}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs app-text-muted">
                Recorded by {interview.createdBy}
                {interview.context ? ` · ${interview.context}` : ""}
              </p>
            </div>
          </details>
        ))
      )}

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold app-border app-text-secondary hover:bg-black/[0.04]"
      >
        <Plus className="h-3.5 w-3.5" />
        Add tech interview
      </button>

      {adding && (
        <TechInterviewDialog
          candidateName={candidate.name}
          defaultSeniority={
            candidate.seniority ?? normalizeSeniority(position.seniority) ?? undefined
          }
          author={user}
          context={`${position.title} · ${projectName}`}
          onClose={() => setAdding(false)}
          onSave={save}
        />
      )}
    </div>
  );
}
