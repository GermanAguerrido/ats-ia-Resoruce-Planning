"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useCurrentUser } from "@/app/lib/currentUser";
import {
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationState,
  stateOf,
  useNotifications,
} from "@/app/lib/notifications";
import { ageLabel } from "@/app/lib/todoItems";

type BellTab = "all" | "unread" | "pending";

/**
 * Campanita de notificaciones: está en todas las pantallas (flotante, abajo a la derecha).
 * Muestra lo que pasó, si falta hacer algo ("pending") o si ya se hizo ("done").
 */
export function NotificationBell() {
  const { user } = useCurrentUser();
  const list = useNotifications(user);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<BellTab>("all");
  const rootRef = useRef<HTMLDivElement>(null);

  const unread = list.filter((item) => !item.readAt).length;
  const shown = list
    .filter((item) =>
      tab === "unread" ? !item.readAt : tab === "pending" ? stateOf(item) === "pending" : true
    )
    .slice(0, 50);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);

    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="fixed bottom-5 right-5 z-[70]">
      {open && (
        <div className="absolute bottom-14 right-0 w-[380px] max-w-[92vw] overflow-hidden rounded-2xl border shadow-2xl app-border app-card">
          <div className="flex items-center gap-2 border-b px-4 py-3 app-border">
            <p className="text-sm font-semibold app-text-primary">Notifications</p>

            <button
              type="button"
              onClick={() => markAllNotificationsRead(user)}
              className="ml-auto rounded-lg border px-2 py-1 text-[11px] font-medium app-border app-text-secondary hover:border-violet-500"
            >
              Mark all as read
            </button>
          </div>

          <div className="flex gap-1.5 border-b px-4 py-2 app-border">
            {(["all", "unread", "pending"] as BellTab[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTab(value)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold capitalize ${
                  tab === value
                    ? "border-violet-500 bg-violet-500/15 app-text-primary"
                    : "app-border app-text-secondary"
                }`}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="max-h-[55vh] overflow-y-auto">
            {shown.length === 0 && (
              <p className="px-4 py-8 text-center text-sm app-text-muted">Nothing here.</p>
            )}

            {shown.map((item) => {
              const state = stateOf(item);

              return (
                <div
                  key={item.id}
                  className={`flex gap-2.5 border-b px-4 py-3 app-border ${
                    item.readAt ? "" : "bg-violet-500/[0.07]"
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.readAt ? "bg-transparent" : "bg-violet-500"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm app-text-primary">{item.text}</p>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[11px] app-text-muted">{ageLabel(item.createdAt)}</span>

                      {state === "pending" && (
                        <span className="rounded-full border border-amber-500/50 px-2 text-[10px] font-bold text-amber-500">
                          pending
                        </span>
                      )}

                      {state === "done" && (
                        <span className="rounded-full border border-emerald-500/50 px-2 text-[10px] font-bold text-emerald-500">
                          done
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {item.href && (
                      <a
                        href={item.href}
                        onClick={() => markNotificationRead(item.id)}
                        className="rounded-lg border px-2 py-0.5 text-[11px] font-semibold app-border app-text-secondary hover:border-violet-500"
                      >
                        Go
                      </a>
                    )}

                    {state === "pending" && (
                      <button
                        type="button"
                        onClick={() => setNotificationState(item.id, "done")}
                        className="rounded-lg border px-2 py-0.5 text-[11px] app-border app-text-secondary hover:border-emerald-500"
                      >
                        ✓ Done
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <a
            href="/todo"
            className="block px-4 py-3 text-center text-sm font-semibold text-violet-500 hover:underline"
          >
            Open my To-Do →
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Notifications"
        className="relative flex h-12 w-12 items-center justify-center rounded-full border shadow-lg app-border app-card app-text-primary hover:border-violet-500"
      >
        <Bell className="h-5 w-5" />

        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
