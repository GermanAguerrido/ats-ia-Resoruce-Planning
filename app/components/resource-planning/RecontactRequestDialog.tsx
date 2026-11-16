"use client";

import { useState } from "react";

import type { CandidateMini } from "@/app/data/resourcePlanningMock";
import { daysSince } from "@/app/lib/candidateStatus";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "./DialogFrame";

/**
 * Pedido de recontacto desde Quick Actions de la ficha. Por defecto le llega al recruiter dueño;
 * se pueden sumar los co-recruiters. Cada uno recibe una notificación y un to-do de prioridad alta.
 */
export function RecontactRequestDialog({
  candidate,
  context,
  requestedBy,
  onClose,
  onConfirm,
}: {
  candidate: CandidateMini;
  // "Posición · Proyecto"
  context: string;
  requestedBy: string;
  onClose: () => void;
  onConfirm: (recipients: string[], message: string) => void;
}) {
  const owner = candidate.recruiterOwner;
  const people = [
    ...(owner ? [{ name: owner, label: "owner" }] : []),
    ...(candidate.coRecruiters ?? [])
      .filter((name) => name !== owner)
      .map((name) => ({ name, label: "co-recruiter" })),
  ];
  const [selected, setSelected] = useState<Set<string>>(() => new Set(owner ? [owner] : []));
  const [message, setMessage] = useState("");
  const days = daysSince(candidate.lastContactAt);

  const toggle = (name: string) =>
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }

      return next;
    });

  return (
    <DialogFrame
      title={`Request recontact · ${candidate.name}`}
      subtitle={`${context} · ${
        days === null ? "no contact registered yet" : `last contact ${days} day${days === 1 ? "" : "s"} ago`
      }`}
      confirmLabel="Send request"
      confirmDisabled={selected.size === 0}
      hint="They get a notification and a high-priority to-do."
      onClose={onClose}
      onConfirm={() => onConfirm(Array.from(selected), message.trim())}
    >
      <FieldLabel>Who should recontact?</FieldLabel>

      <div className="space-y-1.5">
        {people.map((person) => (
          <label
            key={person.name}
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm app-border app-text-primary"
          >
            <input
              type="checkbox"
              checked={selected.has(person.name)}
              onChange={() => toggle(person.name)}
            />
            <span className="font-semibold">{person.name}</span>
            <span className="text-xs app-text-muted">{person.label}</span>
          </label>
        ))}
      </div>

      <FieldLabel>Message (optional)</FieldLabel>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={`${requestedBy} needs this profile for an open position…`}
        className={`${FIELD_CLASS} min-h-[84px] resize-y`}
      />
    </DialogFrame>
  );
}
