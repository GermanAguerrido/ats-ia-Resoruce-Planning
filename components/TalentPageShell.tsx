"use client";

import type { ReactNode } from "react";
import { useCurrentUser } from "@/app/lib/currentUser";
import { StudioLogo } from "./StudioLogo";
import { CandidatesStyles } from "./CandidatesStyles";

/**
 * Marco de las pantallas de trabajo de Talent (AI match, Budget). Los recruiters no las usan:
 * si el usuario activo es recruiter se muestra un aviso en lugar del contenido.
 */
export function TalentPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { user, role } = useCurrentUser();

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <CandidatesStyles />

      <div className="mx-auto max-w-[1700px]">
        <div className="flex items-center gap-4">
          <StudioLogo />
          <h1 className="text-4xl font-bold app-text-primary">{title}</h1>
        </div>

        <p className="mt-2 text-sm app-text-secondary">{subtitle}</p>

        {role === "recruiter" ? (
          <div className="mt-6 rounded-2xl border px-6 py-12 text-center app-border app-card">
            <p className="font-semibold app-text-primary">This area is for Talent.</p>
            <p className="mt-1 text-sm app-text-muted">
              You are acting as {user} (recruiter). Switch to a Talent or Admin user to open it.
            </p>
          </div>
        ) : (
          <div className="mt-5">{children}</div>
        )}
      </div>
    </div>
  );
}
