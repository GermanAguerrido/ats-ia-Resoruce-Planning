"use client";

import { useId, useRef, useState } from "react";
import { Paperclip, Plus, X } from "lucide-react";

import { useInterviewers } from "@/app/hooks/useInterviewers";
import { SENIORITY_LEVELS, todayIso } from "@/app/lib/candidateStatus";
import { makeTechInterviewId, type TechInterview } from "@/app/lib/techInterviews";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "./DialogFrame";

export type TechInterviewDraft = {
  date: string;
  seniority: string;
  opinions: { interviewer: string; text: string }[];
  aiEvaluation: string;
  attachments: string[];
};

export function emptyTechDraft(seniority = "Senior"): TechInterviewDraft {
  return {
    date: todayIso(),
    seniority,
    opinions: [{ interviewer: "", text: "" }],
    aiEvaluation: "",
    attachments: [],
  };
}

/** Válida si tiene fecha, nivel y al menos una conclusión escrita. */
export function isTechDraftValid(draft: TechInterviewDraft) {
  return (
    Boolean(draft.date) &&
    Boolean(draft.seniority) &&
    draft.opinions.some((opinion) => opinion.text.trim().length >= 10)
  );
}

export function techDraftToInterview(
  draft: TechInterviewDraft,
  author: string,
  context?: string
): TechInterview {
  return {
    id: makeTechInterviewId(),
    date: draft.date,
    seniority: draft.seniority,
    opinions: draft.opinions
      .filter((opinion) => opinion.text.trim())
      .map((opinion) => ({
        interviewer: opinion.interviewer.trim() || "Interviewer",
        text: opinion.text.trim(),
      })),
    aiEvaluation: draft.aiEvaluation.trim() || undefined,
    attachments: draft.attachments,
    context,
    createdBy: author,
    createdAt: new Date().toISOString(),
  };
}

export function TechInterviewForm({
  draft,
  onChange,
}: {
  draft: TechInterviewDraft;
  onChange: (next: TechInterviewDraft) => void;
}) {
  const listId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const { names } = useInterviewers();

  const setOpinion = (index: number, patch: Partial<TechInterviewDraft["opinions"][number]>) =>
    onChange({
      ...draft,
      opinions: draft.opinions.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    });

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <FieldLabel required>Interview date</FieldLabel>
          <input
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
            className={FIELD_CLASS}
          />
        </label>

        <label className="block">
          <FieldLabel required>Seniority after the interview</FieldLabel>
          <select
            value={draft.seniority}
            onChange={(event) => onChange({ ...draft, seniority: event.target.value })}
            className={FIELD_CLASS}
          >
            {SENIORITY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <FieldLabel required>Conclusions of the technical interviewers</FieldLabel>

      <datalist id={listId}>
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="space-y-2">
        {draft.opinions.map((opinion, index) => (
          <div key={index} className="rounded-xl border p-3 app-border">
            <div className="flex items-center gap-2">
              <input
                list={listId}
                value={opinion.interviewer}
                onChange={(event) => setOpinion(index, { interviewer: event.target.value })}
                placeholder="Interviewer"
                className={FIELD_CLASS}
              />

              {draft.opinions.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove interviewer"
                  onClick={() =>
                    onChange({
                      ...draft,
                      opinions: draft.opinions.filter((_, i) => i !== index),
                    })
                  }
                  className="app-text-muted hover:opacity-80"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <textarea
              value={opinion.text}
              onChange={(event) => setOpinion(index, { text: event.target.value })}
              placeholder="Final conclusion (strengths, risks, English level...)"
              rows={3}
              className={`${FIELD_CLASS} mt-2 resize-y`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange({ ...draft, opinions: [...draft.opinions, { interviewer: "", text: "" }] })
        }
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-500 hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Add another interviewer
      </button>

      <FieldLabel>AI evaluation from the transcript (optional)</FieldLabel>
      <textarea
        value={draft.aiEvaluation}
        onChange={(event) => onChange({ ...draft, aiEvaluation: event.target.value })}
        placeholder="Paste the result of the prompt that evaluates the recorded interview"
        rows={4}
        className={`${FIELD_CLASS} resize-y`}
      />

      <FieldLabel>Attachments (recording, transcript...)</FieldLabel>
      <div className="flex flex-wrap items-center gap-2">
        {draft.attachments.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs app-border app-text-secondary"
          >
            <Paperclip className="h-3 w-3" />
            {name}
            <button
              type="button"
              aria-label={`Remove ${name}`}
              onClick={() =>
                onChange({
                  ...draft,
                  attachments: draft.attachments.filter((item) => item !== name),
                })
              }
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border px-2.5 py-1 text-xs font-semibold app-border app-text-secondary hover:bg-black/[0.04]"
        >
          Attach
        </button>

        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => {
            const picked = Array.from(event.target.files ?? [], (file: File) => file.name);

            if (picked.length > 0) {
              onChange({
                ...draft,
                attachments: Array.from(new Set([...draft.attachments, ...picked])),
              });
            }

            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/** Diálogo para cargar una entrevista técnica desde la ficha del candidato. */
export function TechInterviewDialog({
  candidateName,
  defaultSeniority,
  author,
  context,
  onClose,
  onSave,
}: {
  candidateName: string;
  defaultSeniority?: string;
  author: string;
  context?: string;
  onClose: () => void;
  onSave: (interview: TechInterview) => void;
}) {
  const [draft, setDraft] = useState(() => emptyTechDraft(defaultSeniority));
  const { addName } = useInterviewers();

  return (
    <DialogFrame
      wide
      title="Add internal tech interview"
      subtitle={`${candidateName} · valid for every position of this candidate`}
      confirmLabel="Save interview"
      confirmDisabled={!isTechDraftValid(draft)}
      hint={isTechDraftValid(draft) ? undefined : "Add the date, level and one conclusion"}
      onClose={onClose}
      onConfirm={() => {
        draft.opinions.forEach((opinion) => addName(opinion.interviewer));
        onSave(techDraftToInterview(draft, author, context));
        onClose();
      }}
    >
      <TechInterviewForm draft={draft} onChange={setDraft} />
    </DialogFrame>
  );
}
