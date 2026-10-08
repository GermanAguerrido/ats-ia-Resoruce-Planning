"use client";

import { useEffect, useState } from "react";

import { INTERNAL_USERS } from "./users";

export type UserRole = "admin" | "talent" | "recruiter";

// Roles provisorios. Con el backend, el rol sale de la tabla de usuarios.
// Germán es Talent; Ana y Sofía son recruiters. Para probar como admin se puede cambiar acá.
export const USER_ROLES: Record<string, UserRole> = {
  Ana: "recruiter",
  Germán: "talent",
  Sofía: "recruiter",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  talent: "Talent",
  recruiter: "Recruiter",
};

const CURRENT_USER_KEY = "ats-ia:resource-planning:current-user";
const DEFAULT_USER = "Germán";

export function getRoleOf(user: string): UserRole {
  return USER_ROLES[user] ?? "recruiter";
}

/** Solo Talent y Admin pueden saltear etapas. */
export function canSkipStages(role: UserRole) {
  return role === "talent" || role === "admin";
}

/** Solo Talent y Admin pueden deshacer movimientos. */
export function canUndoMoves(role: UserRole) {
  return role === "talent" || role === "admin";
}

export function readCurrentUser(): string {
  if (typeof window === "undefined") {
    return DEFAULT_USER;
  }

  try {
    const stored = window.localStorage.getItem(CURRENT_USER_KEY);

    return stored && INTERNAL_USERS.includes(stored) ? stored : DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}

/**
 * Usuario activo (provisorio hasta tener login). Se recuerda en el navegador y se
 * sincroniza entre componentes con un evento.
 */
export function useCurrentUser() {
  const [user, setUserState] = useState(DEFAULT_USER);

  useEffect(() => {
    setUserState(readCurrentUser());

    const sync = () => setUserState(readCurrentUser());

    window.addEventListener("rp-current-user", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("rp-current-user", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setUser = (next: string) => {
    try {
      window.localStorage.setItem(CURRENT_USER_KEY, next);
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }

    setUserState(next);
    window.dispatchEvent(new Event("rp-current-user"));
  };

  return { user, role: getRoleOf(user), setUser };
}
