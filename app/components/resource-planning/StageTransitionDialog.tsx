"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

import type {
  CandidateMini,
  CandidateProcessStatus,
  PositionCard,
  ProjectColumn,
} from "@/app/data/resourcePlanningMock";
import { PROCESS_STATUS_INFO, normalizeSeniority, todayIso } from "@/app/lib/candidateStatus";
import { ROLE_LABELS, canSkipStages, type UserRole } from "@/app/lib/currentUser";
import {
  OUTCOME_REASONS,
  PERSONAL_INFO_FIELDS,
  STAGE_GATES,
  classifyMove,
  countSkippedStages,
  getMissingPersonalInfo,
  type PersonalInfoKey,
  type StageMoveInput,
} from "@/app/lib/stageGates";
import { summarizeTechInterview, useTechInterviews } from "@/app/lib/techInterviews";
import { useInterviewers } from "@/app/hooks/useInterviewers";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "./DialogFrame";
import {
  emptyTechDraft,
  isTechDraftValid,
  techDraftToInterview,
  TechInterviewForm,
} from "./TechInterviewForm";

const MIN_TEXT = 10;

/**
 * Diálogo que se abre siempre que un candidato cambia de etapa (en el Pipeline y en el
 * detalle). Pide lo que corresponde a cada etapa y deja el registro en la tarjeta.
 */
export function StageTransitionDialog({
  candidate,
  project,
  position,
  to,
  user,
  role,
  onCancel,
  onConfirm,
}: {
  candidate: CandidateMini;
  project: ProjectColumn;
  position: PositionCard;
  to: CandidateProcessStatus;
  user: string;
  role: UserRole;
  onCancel: () => void;
  onConfirm: (input: StageMoveInput) => void;
}) {
  const from = candidate.processStatus;
  const kind = classifyMove(from, to);
  const gate = kind === "forward" || kind === "skip" ? STAGE_GATES[to] : undefined;
  const fromLabel = PROCESS_STATUS_INFO[from].label;
  const toLabel = PROCESS_STATUS_INFO[to].label;
  const skipAllowed = canSkipStages(role);

  const missingInfo = gate?.needsPersonalInfo ? getMissingPersonalInfo(candidate) : [];
  const techList = useTechInterviews(candidate.id);
  const { addName } = useInterviewers();

  const [comment, setComment] = useState("");
  const [reason, setReason] = useState("");
  const [skipReason, setSkipReason] = useState("");
  const [date, setDate] = useState(gate?.dateKind === "datetime" ? "" : todayIso());
  const [startDate, setStartDate] = useState("");
  const [reviewAt, setReviewAt] = useState("");
  const [info, setInfo] = useState<Partial<Record<PersonalInfoKey, string>>>({});
  const [techMode, setTechMode] = useState<"existing" | "new">(
    techList.length > 0 ? "existing" : "new"
  );
  const [techId, setTechId] = useState("");
  const [techDraft, setTechDraft] = useState(() =>
    emptyTechDraft(candidate.seniority ?? normalizeSeniority(position.seniority) ?? undefined)
  );

  const commentOk = comment.trim().length >= MIN_TEXT;
  const selectedTech = techList.find((item) => item.id === (techId || techList[0]?.id));

  const checks: boolean[] = [];

  if (kind === "skip") {
    checks.push(skipAllowed, skipReason.trim().length >= MIN_TEXT);
  }

  if (kind === "backward" || kind === "reopen") {
    checks.push(commentOk);
  }

  if (kind === "outcome") {
    checks.push(Boolean(reason), commentOk);
  }

  if (gate) {
    if (gate.commentRequired) {
      checks.push(commentOk);
    }

    if (gate.dateLabel) {
      checks.push(Boolean(date));
    }

    if (gate.startDateLabel) {
      checks.push(Boolean(startDate));
    }

    missingInfo.forEach((key) => checks.push(Boolean(info[key]?.trim())));

    if (gate.needsTechInterview) {
      checks.push(techMode === "existing" ? Boolean(selectedTech) : isTechDraftValid(techDraft));
    }
  }

  const valid = checks.every(Boolean);

  const confirm = () => {
    const input: StageMoveInput = {
      comment: comment.trim() || undefined,
      reason: reason || undefined,
      skipReason: skipReason.trim() || undefined,
      date: date || undefined,
      startDate: startDate || undefined,
      reviewAt: reviewAt || undefined,
    };

    if (missingInfo.length > 0) {
      input.personalInfo = Object.fromEntries(
        missingInfo.map((key) => [key, info[key]?.trim() ?? ""])
      );
    }

    if (gate?.needsTechInterview) {
      if (techMode === "existing" && selectedTech) {
        input.reuseTechInterview = selectedTech;
      } else {
        techDraft.opinions.forEach((opinion) => addName(opinion.interviewer));
        input.newTechInterview = techDraftToInterview(
          techDraft,
          user,
          `${position.title} · ${project.clientName}`
        );
      }
    }

    onConfirm(input);
  };

  const heading =
    kind === "outcome"
      ? `Set ${toLabel}`
      : kind === "backward"
        ? `Move back to ${toLabel}`
        : kind === "reopen"
          ? `Reopen in ${toLabel}`
          : (gate?.title ?? `Move to ${toLabel}`);

  return (
    <DialogFrame
      wide={Boolean(gate?.needsTechInterview && techMode === "new")}
      title={`${heading} · ${candidate.name}`}
      subtitle={
        <>
          <b>{fromLabel}</b> → <b>{toLabel}</b> · {position.title} · {project.clientName}
        </>
      }
      confirmLabel={to === "hired" ? "Confirm hire" : "Confirm move"}
      confirmDisabled={!valid}
      hint={valid ? `Recorded by ${user} (${ROLE_LABELS[role]})` : "Complete the required fields (*)"}
      onClose={onCancel}
      onConfirm={confirm}
    >
      {kind === "skip" && (
        <div className="mt-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs app-text-secondary">
          This skips <b>{countSkippedStages(from, to)}</b> stage(s).{" "}
          {skipAllowed
            ? "The skipped stages stay empty in the history; explain why."
            : `Only Talent or Admin can skip stages. You are ${ROLE_LABELS[role]}: move the candidate one stage at a time or ask Talent.`}
        </div>
      )}

      {kind === "skip" && skipAllowed && (
        <label className="block">
          <FieldLabel required>Reason for skipping</FieldLabel>
          <textarea
            value={skipReason}
            onChange={(event) => setSkipReason(event.target.value)}
            rows={2}
            placeholder="E.g. no client interview in this project"
            className={`${FIELD_CLASS} resize-y`}
          />
        </label>
      )}

      {kind === "backward" && (
        <div className="mt-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs app-text-secondary">
          The candidate goes back one or more stages. The history is kept.
        </div>
      )}

      {(kind === "backward" || kind === "reopen") && (
        <label className="block">
          <FieldLabel required>Reason</FieldLabel>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Why is the candidate going back?"
            className={`${FIELD_CLASS} resize-y`}
          />
        </label>
      )}

      {kind === "outcome" && (
        <>
          <label className="block">
            <FieldLabel required>Reason</FieldLabel>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">Choose a reason...</option>
              {(OUTCOME_REASONS[to] ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <FieldLabel required>Comment</FieldLabel>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              placeholder="What happened? The recruiter will read this in the card."
              className={`${FIELD_CLASS} resize-y`}
            />
          </label>

          {to === "stand_by" && (
            <label className="block">
              <FieldLabel>Review on (optional)</FieldLabel>
              <input
                type="date"
                value={reviewAt}
                onChange={(event) => setReviewAt(event.target.value)}
                className={FIELD_CLASS}
              />
            </label>
          )}

          <p className="mt-3 text-xs app-text-muted">
            {candidate.recruiterOwner
              ? `${candidate.recruiterOwner} (recruiter) will see this in the card's comments.`
              : "Anyone following this card will see this in its comments."}
          </p>
        </>
      )}

      {gate && (kind === "forward" || kind === "skip") && (
        <>
          {gate.needsPersonalInfo && (
            <div className="mt-3">
              <p className="text-xs font-semibold app-text-secondary">Personal info</p>

              <div className="mt-1.5 space-y-1.5">
                {PERSONAL_INFO_FIELDS.map(({ key, label }) => {
                  const missing = missingInfo.includes(key);

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-2 rounded-lg bg-black/[0.03] px-3 py-1.5 text-sm dark:bg-white/[0.04]"
                    >
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-white ${
                          missing && !info[key]?.trim() ? "bg-red-500" : "bg-emerald-500"
                        }`}
                      >
                        {missing && !info[key]?.trim() ? (
                          <X className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>

                      <span className="w-28 shrink-0 text-xs app-text-secondary">{label}</span>

                      {missing ? (
                        <input
                          value={info[key] ?? ""}
                          onChange={(event) =>
                            setInfo((current) => ({ ...current, [key]: event.target.value }))
                          }
                          placeholder={`Add ${label.toLowerCase()}`}
                          className="app-input min-w-0 flex-1 rounded-lg border px-2 py-1 text-sm outline-none"
                        />
                      ) : (
                        <span className="min-w-0 flex-1 truncate app-text-primary">
                          {String(candidate[key])}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gate.needsTechInterview && (
            <div className="mt-3">
              <p className="text-xs font-semibold app-text-secondary">
                Internal tech interview <span className="text-red-500">*</span>
              </p>

              {techList.length > 0 && (
                <div className="mt-1.5 flex gap-2">
                  {(["existing", "new"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTechMode(mode)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        techMode === mode
                          ? "border-violet-500 bg-violet-500/10 text-violet-500"
                          : "app-border app-text-secondary"
                      }`}
                    >
                      {mode === "existing" ? "Reuse an existing one" : "Record a new one"}
                    </button>
                  ))}
                </div>
              )}

              {techMode === "existing" && techList.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {techList.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm app-border"
                    >
                      <input
                        type="radio"
                        name="tech-interview"
                        checked={selectedTech?.id === item.id}
                        onChange={() => setTechId(item.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-semibold app-text-primary">
                          {summarizeTechInterview(item)}
                        </span>
                        {item.context && (
                          <span className="block text-xs app-text-muted">{item.context}</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-1">
                  <TechInterviewForm draft={techDraft} onChange={setTechDraft} />
                </div>
              )}
            </div>
          )}

          {gate.dateLabel && (
            <label className="block">
              <FieldLabel required>{gate.dateLabel}</FieldLabel>
              <input
                type={gate.dateKind === "datetime" ? "datetime-local" : "date"}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={FIELD_CLASS}
              />
            </label>
          )}

          {gate.startDateLabel && (
            <label className="block">
              <FieldLabel required>{gate.startDateLabel}</FieldLabel>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={FIELD_CLASS}
              />
              <span className="mt-1 block text-[11px] app-text-muted">
                The days between hire and start are not counted against the search time.
              </span>
            </label>
          )}

          {gate.commentLabel && (
            <label className="block">
              <FieldLabel required={gate.commentRequired}>{gate.commentLabel}</FieldLabel>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                placeholder={gate.commentPlaceholder}
                className={`${FIELD_CLASS} resize-y`}
              />
            </label>
          )}

          {to === "hired" && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs app-text-secondary">
              <li>The candidate becomes <b>Internal</b> talent and leaves the position list.</li>
              <li>The hire keeps counting in the position and stays in the Candidates database.</li>
            </ul>
          )}
        </>
      )}
    </DialogFrame>
  );
}
