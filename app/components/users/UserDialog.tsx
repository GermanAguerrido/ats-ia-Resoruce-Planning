"use client";

import { useState } from "react";

import { ROLE_LABELS, type UserRole } from "@/app/lib/currentUser";
import {
  COMPANY_EMAIL_DOMAIN,
  type AppUser,
} from "@/app/lib/userDirectory";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "../resource-planning/DialogFrame";

const CREATE_ROLES: UserRole[] = ["talent", "recruiter", "consultora", "it", "hr", "pm"];

/** Alta y edición de usuarios. El nombre no se cambia una vez creado: la app lo usa como clave. */
export function UserDialog({
  user,
  existingNames,
  onClose,
  onSave,
}: {
  user: AppUser | null;
  existingNames: string[];
  onClose: () => void;
  onSave: (user: AppUser) => void;
}) {
  const editing = Boolean(user);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "recruiter");
  const [company, setCompany] = useState(user?.company ?? "");

  const trimmed = name.trim();
  const duplicate =
    !editing && existingNames.some((item) => item.toLowerCase() === trimmed.toLowerCase());
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isCompanyMail = email.trim().toLowerCase().endsWith(`@${COMPANY_EMAIL_DOMAIN}`);
  const roles = editing && user?.role === "admin" ? (["admin"] as UserRole[]) : CREATE_ROLES;
  const auth = role === "consultora" ? "own" : "google";

  let note = "";

  if (role === "consultora") {
    note = "The consultora receives an invitation to set its own password.";
  } else if (email && emailOk && isCompanyMail) {
    note = "Signs in with the Google company account.";
  } else if (email && emailOk) {
    note = `Not a @${COMPANY_EMAIL_DOMAIN} email: Google sign-in only works with company accounts.`;
  }

  const canSave =
    trimmed.length > 0 && !duplicate && emailOk && (role !== "consultora" || company.trim().length > 0);

  return (
    <DialogFrame
      title={editing ? `Edit user · ${user?.name}` : "New user"}
      subtitle={
        editing
          ? "The name cannot be changed: the board uses it to link candidates and comments."
          : "The sign-in method follows the role."
      }
      confirmLabel={editing ? "Save" : role === "consultora" ? "Send invitation" : "Create user"}
      confirmDisabled={!canSave}
      onClose={onClose}
      onConfirm={() =>
        onSave({
          name: trimmed,
          email: email.trim(),
          role,
          auth,
          status: editing ? (user as AppUser).status : auth === "own" ? "invited" : "active",
          company: role === "consultora" ? company.trim() : undefined,
          lastAccess: user?.lastAccess,
        })
      }
    >
      <FieldLabel required>Full name</FieldLabel>
      <input
        value={name}
        disabled={editing}
        onChange={(event) => setName(event.target.value)}
        className={FIELD_CLASS}
      />
      {duplicate && <p className="mt-1 text-xs text-red-500">There is already a user with this name.</p>}

      <FieldLabel required>Email</FieldLabel>
      <input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={`name@${COMPANY_EMAIL_DOMAIN}`}
        className={FIELD_CLASS}
      />

      <FieldLabel>Role</FieldLabel>
      <select
        value={role}
        disabled={user?.role === "admin"}
        onChange={(event) => setRole(event.target.value as UserRole)}
        className={FIELD_CLASS}
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {ROLE_LABELS[item]}
          </option>
        ))}
      </select>

      {role === "consultora" && (
        <>
          <FieldLabel required>Consultora name</FieldLabel>
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className={FIELD_CLASS}
          />
        </>
      )}

      {note && <p className="mt-3 text-xs app-text-muted">{note}</p>}
    </DialogFrame>
  );
}
