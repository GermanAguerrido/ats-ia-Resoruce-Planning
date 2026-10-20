"use client";

import { useEffect, useState } from "react";

// Notificaciones internas. Por ahora viven en el navegador; la sección "To-Do y notificaciones"
// las muestra y, con el backend, salen de una tabla compartida.
export type AppNotification = {
  id: string;
  // Usuario que la recibe
  to: string;
  from: string;
  kind: "recontact";
  text: string;
  candidateId: string;
  candidateName: string;
  projectId?: string;
  positionId?: string;
  createdAt: string;
  readAt?: string;
};

const NOTIFICATIONS_KEY = "ats-ia:resource-planning:notifications";
const NOTIFICATIONS_EVENT = "rp-notifications";

export function readNotifications(): AppNotification[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function pushNotification(
  notification: Omit<AppNotification, "id" | "createdAt">
): AppNotification {
  const entry: AppNotification = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(
      NOTIFICATIONS_KEY,
      JSON.stringify([entry, ...readNotifications()])
    );
    window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }

  return entry;
}

export function useNotifications(user: string) {
  const [all, setAll] = useState<AppNotification[]>([]);

  useEffect(() => {
    const sync = () => setAll(readNotifications());

    sync();
    window.addEventListener(NOTIFICATIONS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return all.filter((item) => item.to === user);
}
