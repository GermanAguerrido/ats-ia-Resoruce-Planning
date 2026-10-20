"use client";

import { useState } from "react";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "../resource-planning/DialogFrame";
import { daysSince } from "@/app/lib/candidateStatus";
import type { CandidateRow } from "@/app/lib/candidateRows";

type Props = {
  row: CandidateRow;
  requestedBy: string;
  onClose: () => void;
  onConfirm: (message: string) => void;
};

/** Le avisa al recruiter dueño de la persona que hay que volver a contactarla. */
export function RecontactDialog({ row, requestedBy, onClose, onConfirm }: Props) {
  const [message, setMessage] = useState("");
  const recruiter = row.main.recruiterOwner;
  const days = daysSince(row.main.lastContactAt);

  return (
    <DialogFrame
      title={`Ask ${recruiter ?? "the recruiter"} to recontact ${row.main.name}?`}
      subtitle={
        days === null
          ? "No contact registered yet."
          : `Last contact ${days} day${days === 1 ? "" : "s"} ago.`
      }
      confirmLabel="Send recontact request"
      confirmDisabled={!recruiter}
      hint={
        recruiter
          ? `${recruiter} gets a notification and a to-do.`
          : "This candidate has no recruiter assigned yet."
      }
      onClose={onClose}
      onConfirm={() => onConfirm(message.trim())}
    >
      <FieldLabel>Message (optional)</FieldLabel>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={`Hi ${recruiter ?? ""}, ${requestedBy} needs this profile for an open position…`}
        className={`${FIELD_CLASS} min-h-[84px] resize-y`}
      />
    </DialogFrame>
  );
}
