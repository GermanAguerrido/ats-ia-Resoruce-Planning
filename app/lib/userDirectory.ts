"use client";

import { useEffect, useState } from "react";

import type { UserRole } from "./currentUser";

/**
 * Directorio de usuarios (sección D). Por ahora vive en el navegador; con el backend sale de la
 * tabla de usuarios, el login es con Google para el equipo y con credenciales propias para la
 * consultora. El nombre es la clave con la que el resto de la app guarda responsables
 * (recruiterOwner, owner, comentarios), por eso no se puede cambiar una vez creado el usuario.
 */
export type UserStatus = "active" | "invited" | "disabled";
export type AuthMethod = "google" | "own";

export type AppUser = {
  name: string;
  email: string;
  role: UserRole;
  auth: AuthMethod;
  status: UserStatus;
  // Solo para la consultora
  company?: string;
  lastAccess?: string;
};

// Dominio de las cuentas Google de la empresa (confirmar con el dominio real antes del backend)
export const COMPANY_EMAIL_DOMAIN = "trickstudios.com";
// Dominio de los mails corporativos que crea IT para cada persona nueva (template de la ficha)
export const CORPORATE_EMAIL_DOMAIN = "trickgs.com";

export const DEFAULT_USERS: AppUser[] = [
  { name: "Germán", email: "", role: "talent", auth: "google", status: "active" },
  { name: "Ana", email: "", role: "recruiter", auth: "google", status: "active" },
  { name: "Sofía", email: "", role: "recruiter", auth: "google", status: "active" },
  { name: "Owner", email: "", role: "admin", auth: "google", status: "active" },
  // Usuario de prueba para ver lo que ve la consultora
  {
    name: "Consultora",
    email: "",
    role: "consultora",
    auth: "own",
    status: "invited",
    company: "Consultora de prueba",
  },
  // Pasos del onboarding (sección F): cada uno completa solo el suyo
  { name: "Camilo", email: "", role: "it", auth: "google", status: "active" },
  { name: "Laura", email: "", role: "hr", auth: "google", status: "active" },
  { name: "Lucas", email: "", role: "pm", auth: "google", status: "active" },
];

// Usuarios semilla de roles nuevos: se suman a un directorio guardado antes de que existieran
const SEEDED_ROLES: UserRole[] = ["it", "hr", "pm"];

const USERS_KEY = "ats-ia:resource-planning:users";
const USERS_EVENT = "rp-users";

export function readUsers(): AppUser[] {
  if (typeof window === "undefined") {
    return DEFAULT_USERS;
  }

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_USERS;
    }

    const stored = parsed as AppUser[];
    const missing = DEFAULT_USERS.filter(
      (seed) =>
        SEEDED_ROLES.includes(seed.role) &&
        !stored.some((item) => item.name === seed.name || item.role === seed.role)
    );

    return missing.length > 0 ? [...stored, ...missing] : stored;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: AppUser[]) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }

  window.dispatchEvent(new Event(USERS_EVENT));
}

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);

  useEffect(() => {
    const sync = () => setUsers(readUsers());

    sync();
    window.addEventListener(USERS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(USERS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return users;
}

/** Personas que pueden ser responsables de cuentas, posiciones y candidatos (activas, Talent y Recruiters). */
export function getInternalUsers(users: AppUser[] = readUsers()): string[] {
  return users
    .filter(
      (user) => user.status !== "disabled" && (user.role === "talent" || user.role === "recruiter")
    )
    .map((user) => user.name);
}

/** Marca el último acceso de un usuario (cuando se cambia "Acting as"). */
export function touchUser(name: string) {
  const users = readUsers();

  if (!users.some((user) => user.name === name)) {
    return;
  }

  saveUsers(
    users.map((user) =>
      user.name === name ? { ...user, lastAccess: new Date().toISOString() } : user
    )
  );
}
