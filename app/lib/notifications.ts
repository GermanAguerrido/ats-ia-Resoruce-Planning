"use client";

import { useEffect, useState } from "react";

// Notificaciones internas (la campanita y el To-Do). Por ahora viven en el navegador; con el
// backend salen de una tabla compartida y llegan a cada usuario en tiempo real.
export type NotificationKind = "recontact" | "sourcing" | "stage" | "info";

// pending = pide una acción y se cierra con "Done"; done = ya resuelta; info = solo informa
export type NotificationState = "pending" | "done" | "info";

export type AppNotification = {
  id: string;
  // Usuario que la recibe
  to: string;
  from: string;
  kind: NotificationKind;
  state?: NotificationState;
  text: string;
  candidateId?: string;
  candidateName?: string;
  projectId?: string;
  positionId?: string;
  // Clave para no repetir pedidos iguales (por ejemplo "sourcing:ui artist:SR")
  ref?: string;
  // Pantalla a la que lleva
  href?: string;
  createdAt: string;
  readAt?: string;
};

const NOTIFICATIONS_KEY = "ats-ia:resource-planning:notifications";
const NOTIFICATIONS_EVENT = "rp-notifications";

/** Estado de una notificación; las que no lo traen se deducen del tipo. */
export function stateOf(notification: AppNotification): NotificationState {
  if (notification.state) {
    return notification.state;
  }

  return notification.kind === "recontact" || notification.kind === "sourcing"
    ? "pending"
    : "info";
}

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

function writeNotifications(list: AppNotification[]) {
  try {
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 500)));
    window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
  } catch {
    // Local storage can fail in private browsing or quota situations.
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

  writeNotifications([entry, ...readNotifications()]);

  return entry;
}

function updateWhere(
  match: (item: AppNotification) => boolean,
  change: (item: AppNotification) => AppNotification
) {
  writeNotifications(readNotifications().map((item) => (match(item) ? change(item) : item)));
}

export function markNotificationRead(id: string) {
  updateWhere(
    (item) => item.id === id && !item.readAt,
    (item) => ({ ...item, readAt: new Date().toISOString() })
  );
}

export function markAllNotificationsRead(user: string) {
  updateWhere(
    (item) => item.to === user && !item.readAt,
    (item) => ({ ...item, readAt: new Date().toISOString() })
  );
}

export function setNotificationState(id: string, state: NotificationState) {
  updateWhere(
    (item) => item.id === id,
    (item) => ({
      ...item,
      state,
      readAt: item.readAt ?? (state === "done" ? new Date().toISOString() : undefined),
    })
  );
}

/** Notificaciones del usuario, de la más nueva a la más vieja; se actualizan solas entre pestañas. */
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

/** Notificaciones de todos los usuarios (para saber si un pedido ya se hizo). */
export function useAllNotifications() {
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

  return all;
}
