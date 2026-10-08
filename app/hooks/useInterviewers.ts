"use client";

import { useEffect, useState } from "react";

const INTERVIEWERS_KEY = "ats-ia:resource-planning:interviewers";

/**
 * Lista de entrevistadores (internos y de clientes). Crece sola: si se escribe un nombre
 * que no está, se agrega; si ya está, se asigna. Con backend, esta lista sale de la base.
 */
export function useInterviewers() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(INTERVIEWERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        setNames(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      setNames([]);
    }
  }, []);

  const addName = (name: string) => {
    const trimmed = name.trim();

    if (!trimmed || names.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    const next = [...names, trimmed].sort((a, b) => a.localeCompare(b));

    setNames(next);

    try {
      window.localStorage.setItem(INTERVIEWERS_KEY, JSON.stringify(next));
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  };

  return { names, addName };
}