"use client";

import { useState } from "react";

import type { CandidateMini, CandidateProcessStatus } from "@/app/data/resourcePlanningMock";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "./DialogFrame";

export const INTERVIEW_TYPES: { type: CandidateProcessStatus; label: string }[] = [
  { type: "screening", label: "Recruiter interview" },
  { type: "tech_interview", label: "Internal tech interview" },
  { type: "client_interview", label: "Client tech interview" },
];

export function getInterviewTypeLabel(type: CandidateProcessStatus) {
  return INTERVIEW_TYPES.find((item) => item.type === type)?.label ?? "Interview";
}

/** Registra un contacto con el candidato (respondió o no). */
export function ContactDialog({
  candidate,
  onCancel,
  onConfirm,
}: {
  candidate: CandidateMini;
  onCancel: () => void;
  onConfirm: (result: { replied: boolean; note: string }) => void;
}) {
  const [replied, setReplied] = useState(true);
  const [note, setNote] = useState("");

  return (
    <DialogFrame
      title={`Log contact · ${candidate.name}`}
      subtitle="Updates “Last contact” and leaves a comment on the card."
      confirmLabel="Save contact"
      onClose={onCancel}
      onConfirm={() => onConfirm({ replied, note: note.trim() })}
    >
      <label className="block">
        <FieldLabel>Result</FieldLabel>
        <select
          value={replied ? "replied" : "none"}
          onChange={(event) => setReplied(event.target.value === "replied")}
          className={FIELD_CLASS}
        >
          <option value="replied">Replied</option>
          <option value="none">No reply</option>
        </select>
      </label>

      <label className="block">
        <FieldLabel>Note (optional)</FieldLabel>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="Channel, what was said, next step..."
          className={`${FIELD_CLASS} resize-y`}
        />
      </label>
    </DialogFrame>
  );
}

/** Agenda una entrevista (puede ser a futuro). */
export function ScheduleDialog({
  candidate,
  onCancel,
  onConfirm,
}: {
  candidate: CandidateMini;
  onCancel: () => void;
  onConfirm: (value: { type: CandidateProcessStatus; at: string }) => void;
}) {
  const current = candidate.scheduledInterview;
  const [type, setType] = useState<CandidateProcessStatus>(
    current?.type ?? "screening"
  );
  const [at, setAt] = useState(current?.at ?? "");

  return (
    <DialogFrame
      title={`Schedule interview · ${candidate.name}`}
      subtitle="Saved on the card; the board alerts when the date passes without moving the candidate."
      confirmLabel="Save"
      confirmDisabled={!at}
      onClose={onCancel}
      onConfirm={() => onConfirm({ type, at })}
    >
      <label className="block">
        <FieldLabel required>Interview</FieldLabel>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as CandidateProcessStatus)}
          className={FIELD_CLASS}
        >
          {INTERVIEW_TYPES.map((item) => (
            <option key={item.type} value={item.type}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <FieldLabel required>Date and time</FieldLabel>
        <input
          type="datetime-local"
          value={at}
          onChange={(event) => setAt(event.target.value)}
          className={FIELD_CLASS}
        />
      </label>
    </DialogFrame>
  );
}
