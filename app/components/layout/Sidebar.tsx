"use client";

import Link from "next/link";
import { useState } from "react";
import { useCurrentUser } from "../../lib/currentUser";
import { countOpenTodos, useTodoItems } from "../../lib/todoItems";
import { NotificationBell } from "../todo/NotificationBell";
import { ThemeToggle } from "./ThemeToggle";

type MenuItem = {
  label: string;
  href: string;
  // Solo se muestra a Talent y Admin (no a recruiters)
  talentOnly?: boolean;
};

const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    href: "/",
  },
  {
    label: "Candidates",
    href: "/candidates",
  },
  {
    label: "Resource Planning",
    href: "/jobs",
  },
  {
    label: "To-Do",
    href: "/todo",
  },
  {
    label: "AI Match",
    href: "/ai-match",
    talentOnly: true,
  },
  {
    label: "Budget",
    href: "/budget",
    talentOnly: true,
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, role } = useCurrentUser();
  const todoCount = countOpenTodos(useTodoItems(user, role, "mine"));

  const visibleItems = menuItems.filter(
    (item) => !item.talentOnly || role === "talent" || role === "admin"
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
