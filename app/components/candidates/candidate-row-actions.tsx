"use client";

import { useState } from "react";
import {
  Archive,
  MoreHorizontal,
  StickyNote,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";

export function CandidateRowActions() {
  const [open, setOpen] = useState(false);

  const menuItemClassName =
    "flex w-full items-center gap-3 px-4 py-3 text-sm transition app-text-secondary hover:underline";

  const iconClassName = "h-4 w-4 app-text-muted";

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg p-2 transition app-text-secondary hover:underline"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl border shadow-2xl app-card">
          <button className={menuItemClassName}>
            <UserCheck className={iconClassName} />
            View profile
          </button>

          <button className={menuItemClassName}>
            <Users className={iconClassName} />
            Move stage
          </button>

          <button className={menuItemClassName}>
            <StickyNote className={iconClassName} />
            Add note
          </button>

          <button className={menuItemClassName}>
            <Archive className={iconClassName} />
            Archive
          </button>

          <div className="my-1 h-px app-bg" />

          <button className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition hover:underline">
            <UserMinus className="h-4 w-4 text-red-500" />
            Reject candidate
          </button>
        </div>
      )}
    </div>
  );
}