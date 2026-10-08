"use client";

import { useEffect, useState } from "react";

/** Pide la fecha de contratación al marcar un candidato como Hired. */
export function HireDateDialog({
  candidateName,
  onCancel,
  onConfirm,
}: {
  candidateName: string;
  onCancel: () => void;
  onConfirm: (date: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mark as Hired"
        className="w-full max-w-[470px] overflow-hidden rounded-2xl border shadow-2xl app-border app-card"
      >
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold app-text-primary">
            Mark {candidateName} as Hired
          </h3>

          <p className="mt-3 text-sm leading-6 app-text-secondary">This will:</p>

          <ul className="mb-3 mt-1 list-disc space-y-1 pl-5 text-sm app-text-secondary">
            <li>
              set the status to <b>Hired</b> with the hire date,
            </li>
            <li>
              turn the candidate into <b>Internal</b> talent,
            </li>
            <li>keep counting the hire in the position,</li>
            <li>keep the candidate in the Candidates database for future positions.</li>
          </ul>

          <label className="block text-xs font-semibold app-text-secondary">
            Hire date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="app-input mt-1.5 w-full rounded-xl border px-3 py-2 text-sm outline-none"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4 app-border">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(date || new Date().toISOString().slice(0, 10))}
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            className="rounded-xl px-5 py-2 text-sm font-semibold transition hover:opacity-90"
          >
            Confirm hire
          </button>
        </div>
      </div>
    </div>
  );
}