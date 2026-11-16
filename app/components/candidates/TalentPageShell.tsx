"use client";

import type { ReactNode } from "react";
import { ROLE_LABELS, useCurrentUser } from "@/app/lib/currentUser";
import { levelOf, usePermissions, type AreaId } from "@/app/lib/permissions";
import { StudioLogo } from "./StudioLogo";
import { CandidatesStyles } from "./CandidatesStyles";

/**
 * Marco de las pantallas de trabajo de Talent (AI match, Budget). Según los permisos del rol (sección D):
 * sin acceso se muestra un aviso; con "view only" el contenido se ve pero no se puede editar.
 */
export function TalentPageShell({
  area,
  title,
  subtitle,
  children,
}: {
  area: AreaId;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { user, role } = useCurrentUser();
  const level = levelOf(role, area, usePermissions());

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <CandidatesStyles />

      <div className="mx-auto max-w-[1700px]">
        <div className="flex items-center gap-4">
          <StudioLogo />
          <h1 className="text-4xl font-bold app-text-primary">{title}</h1>
        </div>

        <p className="mt-2 text-sm app-text-secondary">{subtitle}</p>

        {level === "none" ? (
          <div className="mt-6 rounded-2xl border px-6 py-12 text-center app-border app-card">
            <p className="font-semibold app-text-primary">You do not have access to this area.</p>
            <p className="mt-1 text-sm app-text-muted">
              You are acting as {user} ({ROLE_LABELS[role]}). Ask the Owner to change your permissions in Users.
            </p>
          </div>
        ) : (
          <div className="mt-5">
            {level === "view" && (
              <p className="mb-3 rounded-xl border px-4 py-2 text-sm app-border app-text-muted">
                View only: your role can see this screen but not change it.
              </p>
            )}

            {/* Con "view only" todos los campos y botones quedan deshabilitados */}
            <fieldset disabled={level === "view"} className="contents">
              {children}
            </fieldset>
          </div>
        )}
      </div>
    </div>
  );
}
