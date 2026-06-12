"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const menuItems = [
  {
    label: "Dashboard",
    href: "/",
  },
  {
    label: "Candidates",
    href: "/candidates",
  },
  {
    label: "Open Positions",
    href: "/jobs",
  },
  {
    label: "Kanban",
    href: "/kanban",
  },
  {
    label: "Interviews",
    href: "/interviews",
  },
];

export function Sidebar() {
  return (
    <aside
      className="min-h-screen w-[260px] shrink-0 border-r px-6 py-8"
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
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="block rounded-xl px-4 py-3 text-sm font-medium transition"
            style={{
              color: "var(--sidebar-text)",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}