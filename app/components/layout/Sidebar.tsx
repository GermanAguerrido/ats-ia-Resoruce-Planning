"use client";

import Link from "next/link";
import { useState } from "react";
import { useCurrentUser } from "../../lib/currentUser";
import { levelOf, usePermissions, type AreaId } from "../../lib/permissions";
import { useOnboardingReminders } from "../../lib/onboarding";
import { countOpenTodos, useTodoItems } from "../../lib/todoItems";
import { NotificationBell } from "../todo/NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

type MenuItem = {
  label: string;
  href: string;
  // Se muestra si el rol tiene alguno de estos niveles en alguna de estas áreas (sección D)
  areas: AreaId[];
  levels?: Array<"full" | "own" | "view">;
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/",
    areas: ["dashboard_overview", "dashboard_mine"],
  },
  {
    label: "Candidates",
    href: "/candidates",
    areas: ["candidates"],
    // "Own only" es la consultora: ella trabaja desde su propio módulo (/consultora)
    levels: ["full", "view"],
  },
  {
    label: "Resource Planning",
    href: "/jobs",
    areas: ["resource_planning"],
  },
  {
    label: "To-Do",
    href: "/todo",
    areas: ["todo_mine"],
  },
  {
    label: "AI Match",
    href: "/ai-match",
    areas: ["ai_match"],
  },
  {
    label: "Budget",
    href: "/budget",
    areas: ["budget"],
  },
  {
    label: "Consultora",
    href: "/consultora",
    areas: ["consultora_candidates", "consultora_positions", "charge_approval"],
  },
  {
    label: "Onboarding",
    href: "/onboarding",
    areas: ["onboarding"],
  },
  {
    label: "Users",
    href: "/users",
    areas: ["users"],
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role } = useCurrentUser();

  // Avisa a la recruiter cuando alguien pasa a Hired y falta la ficha de onboarding
  useOnboardingReminders();
  const todoCount = countOpenTodos(useTodoItems(user, role, "mine"));

  // Qué ve cada rol sale de la matriz de permisos (sección D)
  const permissions = usePermissions();
  const visibleItems = menuItems.filter((item) =>
    item.areas.some((area) => {
      const level = levelOf(role, area, permissions);

      return item.levels ? (item.levels as string[]).includes(level) : level !== "none";
    })
  );

  return (
    <>
      {/* Hover trigger zone */}
      <div
        onMouseEnter={() => setIsOpen(true)}
        className="fixed left-0 top-0 z-40 h-full w-4"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        onMouseLeave={() => setIsOpen(false)}
        className={`fixed left-0 top-0 z-50 h-full w-[260px] shrink-0 transform border-r px-6 py-8 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderColor: "var(--sidebar-border)",
        }}
      >
        <h1
          className="mb-6 text-4xl font-bold"
          style={{
            color: "var(--sidebar-title)",
          }}
        >
          ATS IA
        </h1>

        <ThemeToggle />

        <nav className="space-y-2">
          {visibleItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium transition"
              style={{
                color: "var(--sidebar-text)",
              }}
            >
              {item.label}
              {item.href === "/todo" && todoCount > 0 && (
                <span className="ml-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {todoCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Campanita de notificaciones: visible en todas las pantallas */}
      <NotificationBell />
    </>
  );
}
