"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="mb-8 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition"
      style={{
        backgroundColor: "var(--sidebar-item-bg)",
        borderColor: "var(--sidebar-border)",
        color: "var(--sidebar-text)",
      }}
    >
      <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
      <span>{isDark ? "🌙" : "☀️"}</span>
    </button>
  );
}