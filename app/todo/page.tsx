"use client";

import { useEffect, useMemo, useState } from "react";
import { CandidatesStyles, Tag } from "../components/candidates/CandidatesStyles";
import { SourcingPanel } from "../components/todo/SourcingPanel";
import { useCurrentUser } from "../lib/currentUser";
import { setNotificationState } from "../lib/notifications";
import {
  PRIORITY_INFO,
  TODO_TYPES,
  ageLabel,
  snoozeTodo,
  todoHref,
  unsnoozeTodo,
  useTodoItems,
  type TodoItem,
  type TodoPriority,
  type TodoType,
} from "../lib/todoItems";

type Tab = "todo" | "done" | "sourcing";

const PRIORITIES: TodoPriority[] = ["high", "med", "low"];

export default function TodoPage() {
  const { user, role } = useCurrentUser();
  const isTalent = role === "talent" || role === "admin";

  const [tab, setTab] = useState<Tab>("todo");
  const [scope, setScope] = useState<"mine" | "team">("mine");
  const [typeFilter, setTypeFilter] = useState<"" | TodoType>("");
  const [showSnoozed, setShowSnoozed] = useState(false);
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);

  const entries = useTodoItems(user, role, scope);

  // Enlace directo a la pestaña de sourcing (/todo?tab=sourcing)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tab") === "sourcing") {
      setTab("sourcing");
    }
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 6000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(
    () => entries.filter((entry) => !typeFilter || entry.item.type === typeFilter),
    [entries, typeFilter]
  );

  const openEntries = filtered.filter((entry) => !entry.item.done && !entry.snoozed);
  const snoozedEntries = filtered.filter((entry) => !entry.item.done && entry.snoozed);
  const doneEntries = filtered.filter((entry) => entry.item.done);

  const complete = (item: TodoItem) => {
    if (!item.notificationId) {
      return;
    }

    const id = item.notificationId;

    setNotificationState(id, "done");
    setToast({ text: "Marked as done", undo: () => setNotificationState(id, "pending") });
  };

  const snooze = (item: TodoItem) => {
    snoozeTodo(user, item.id);
    setToast({ text: "Hidden until tomorrow", undo: () => unsnoozeTodo(user, item.id) });
  };

  const renderItem = (item: TodoItem, snoozed = false) => {
    const type = TODO_TYPES[item.type];
    const href = todoHref(item.action);

    return (
      <div
        key={item.id}
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 app-border app-card ${
          item.done || snoozed ? "opacity-70" : ""
        }`}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-base">
          {type.icon}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm font-semibold app-text-primary ${item.done ? "line-through" : ""}`}
          >
            {item.title}
          </p>
          <p className="mt-0.5 text-xs app-text-muted">{item.context}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Tag tone="gray" small>
              {type.label}
            </Tag>
            <Tag
              tone="gray"
              small
              title={
                item.auto
                  ? "Disappears by itself when the situation is fixed"
                  : "Stays until it is marked as done"
              }
            >
              {item.auto ? "auto-resolves" : "manual"}
            </Tag>
            {scope === "team" && item.owner && (
              <Tag tone="violet" small>
                {item.owner}
              </Tag>
            )}
            {item.createdAt && (
              <span className="text-[11px] app-text-muted">{ageLabel(item.createdAt)}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {item.done ? (
            item.notificationId && (
              <button
                type="button"
                onClick={() => setNotificationState(item.notificationId as string, "pending")}
                className="rounded-lg border px-2.5 py-1 text-xs app-border app-text-secondary hover:border-violet-500"
              >
                Reopen
              </button>
            )
          ) : (
            <>
              {item.action.kind === "sourcing" ? (
                <button
                  type="button"
                  onClick={() => setTab("sourcing")}
                  style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90"
                >
                  {item.actionLabel}
                </button>
              ) : (
                <a
                  href={href}
                  style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90"
                >
                  {item.actionLabel}
                </a>
              )}

              {item.auto ? (
                snoozed ? (
                  <button
                    type="button"
                    onClick={() => unsnoozeTodo(user, item.id)}
                    className="rounded-lg border px-2.5 py-1 text-xs app-border app-text-secondary hover:border-violet-500"
                  >
                    Unsnooze
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => snooze(item)}
                    title="Hide it until tomorrow"
                    className="rounded-lg border px-2.5 py-1 text-xs app-border app-text-secondary hover:border-violet-500"
                  >
                    Snooze 1d
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => complete(item)}
                  className="rounded-lg border px-2.5 py-1 text-xs app-border app-text-secondary hover:border-emerald-500"
                >
                  ✓ Done
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const tabs: Array<{ value: Tab; label: string; count?: number }> = [
    { value: "todo", label: "To do", count: openEntries.length },
    { value: "done", label: "Done", count: doneEntries.length },
    ...(isTalent ? [{ value: "sourcing" as Tab, label: "Sourcing alerts" }] : []),
  ];

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <CandidatesStyles />

      <div className="mx-auto max-w-[1100px]">
        <h1 className="text-4xl font-bold app-text-primary">To-Do</h1>

        <p className="mt-2 text-sm app-text-secondary">
          {isTalent
            ? "Everything that needs your attention. You can switch to the whole team."
            : "Everything that needs your attention. You only see your own items."}
        </p>

        <div className="mt-5 flex gap-0.5 border-b app-border">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={`border-b-2 px-4 py-2 text-sm font-semibold transition ${
                tab === item.value
                  ? "border-violet-500 text-violet-500"
                  : "border-transparent app-text-muted hover:text-violet-400"
              }`}
            >
              {item.label}
              {item.count !== undefined && (
                <span className="ml-1.5 text-xs font-normal app-text-muted">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab !== "sourcing" && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as "" | TodoType)}
              className="app-input rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">All types</option>
              {(Object.keys(TODO_TYPES) as TodoType[]).map((type) => (
                <option key={type} value={type}>
                  {TODO_TYPES[type].label}
                </option>
              ))}
            </select>

            {isTalent && (
              <div className="flex overflow-hidden rounded-xl border app-border">
                {(["mine", "team"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScope(value)}
                    className={`px-3 py-2 text-sm ${
                      scope === value
                        ? "bg-violet-600 font-semibold text-white"
                        : "app-text-secondary hover:bg-black/[0.04]"
                    }`}
                  >
                    {value === "mine" ? "Mine" : "Whole team"}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "todo" && (
          <div className="mt-2">
            {openEntries.length === 0 && (
              <div className="mt-4 rounded-2xl border px-4 py-12 text-center app-border app-card app-text-muted">
                🎉 You are all caught up.
              </div>
            )}

            {PRIORITIES.map((priority) => {
              const group = openEntries.filter((entry) => entry.item.priority === priority);

              if (group.length === 0) {
                return null;
              }

              return (
                <div key={priority}>
                  <p className="mb-2 mt-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide app-text-muted">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: PRIORITY_INFO[priority].color }}
                    />
                    {PRIORITY_INFO[priority].label} · {group.length}
                  </p>

                  <div className="space-y-2">{group.map((entry) => renderItem(entry.item))}</div>
                </div>
              );
            })}

            {snoozedEntries.length > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowSnoozed((current) => !current)}
                  className="text-xs font-semibold text-violet-500 hover:underline"
                >
                  {showSnoozed ? "Hide" : "Show"} snoozed ({snoozedEntries.length})
                </button>

                {showSnoozed && (
                  <div className="mt-2 space-y-2">
                    {snoozedEntries.map((entry) => renderItem(entry.item, true))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "done" && (
          <div className="mt-4 space-y-2">
            {doneEntries.length === 0 && (
              <div className="rounded-2xl border px-4 py-12 text-center app-border app-card app-text-muted">
                Nothing completed yet.
              </div>
            )}

            {doneEntries.map((entry) => renderItem(entry.item))}
          </div>
        )}

        {tab === "sourcing" && isTalent && (
          <div className="mt-4">
            <SourcingPanel user={user} onAsked={(text) => setToast({ text })} />
          </div>
        )}

        <div className="mt-6 rounded-xl border px-4 py-3 text-xs leading-6 app-border app-card app-text-muted">
          <b className="app-text-secondary">High</b>: overdue or blocking a process (interview date
          passed, 14+ days in a stage, position without candidates, recontact requests).{" "}
          <b className="app-text-secondary">Medium</b>: act soon (NDA, stand-by review, position on
          hold). <b className="app-text-secondary">Low</b>: opportunities and reminders (ready to
          present, long without contact). Alerts that are calculated disappear by themselves when
          they are fixed; requests from other people stay until you mark them as done.
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-4 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-xl">
          <span>{toast.text}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                setToast(null);
              }}
              className="font-bold text-violet-300 hover:underline"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
