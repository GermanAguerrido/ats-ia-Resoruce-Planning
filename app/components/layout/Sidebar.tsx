"use client";

import Link from "next/link";
import { useState } from "react";
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
    label: "Resource Planning",
    href: "/jobs",
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

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
          {menuItems.map((item) => (
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
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
