"use client";

import Link from "next/link";
import { useCurrentUser } from "@/app/lib/currentUser";
import { countOpenTodos, useTodoItems } from "@/app/lib/todoItems";

/** Reemplaza a "Needs attention" en el Dashboard: resumen de mis pendientes con acceso al To-Do. */
export function MyTodoCard() {
  const { user, role } = useCurrentUser();
  const entries = useTodoItems(user, role, "mine");
  const open = entries.filter((entry) => !entry.item.done && !entry.snoozed);
  const high = open.filter((entry) => entry.item.priority === "high");
  const top = [...high, ...open.filter((entry) => entry.item.priority !== "high")].slice(0, 3);

  return (
    <section className="overflow-hidden rounded-2xl border app-border app-card">
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="text-4xl font-extrabold app-text-primary">{countOpenTodos(entries)}</span>

        <div>
          <p className="text-sm font-semibold app-text-primary">My To-Do</p>
          <p className="text-xs app-text-muted">
            {high.length} high priority · acting as {user}
          </p>
        </div>

        <Link
          href="/todo"
          style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
          className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90"
        >
          Open To-Do →
        </Link>
      </div>

      {top.length > 0 ? (
        top.map(({ item }) => (
          <p key={item.id} className="border-t px-5 py-2.5 text-sm app-border app-text-secondary">
            {item.title}
          </p>
        ))
      ) : (
        <p className="border-t px-5 py-4 text-center text-sm app-border app-text-muted">
          You are all caught up.
        </p>
      )}
    </section>
  );
}
