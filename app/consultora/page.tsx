"use client";

import { useEffect, useMemo, useState } from "react";

import { pushNotification } from "../lib/notifications";
import { CandidatesStyles } from "../components/candidates/CandidatesStyles";
import {
  InternalCandidates,
  MyCandidates,
  listConsultoraCandidates,
} from "../components/consultora/ConsultoraCandidates";
import { ConsultoraBillingView, TalentBillingView } from "../components/consultora/ConsultoraBilling";
import { ConsultoraPositions } from "../components/consultora/ConsultoraPositions";
import { LoadProfileDialog } from "../components/consultora/LoadProfileDialog";
import { NoAccessScreen } from "../components/dashboard/NoAccessScreen";
import { CurrentUserSwitcher } from "../components/resource-planning/CurrentUserSwitcher";
import { useBoardState } from "../hooks/useBoardState";
import { buildCandidateDirectory } from "../lib/candidateDirectory";
import {
  listConsultoraHires,
  listOpenPositions,
  useBilling,
  useConsultoraPositionSettings,
} from "../lib/consultora";
import { getRoleOf, useCurrentUser } from "../lib/currentUser";
import { levelOf, usePermissions } from "../lib/permissions";
import { useUsers } from "../lib/userDirectory";

type Tab = "candidates" | "positions" | "billing";

const TAB_LABELS: Record<Tab, string> = {
  candidates: "Candidates",
  positions: "Open positions",
  billing: "Billing",
};

export default function ConsultoraPage() {
  const { user, role } = useCurrentUser();
  const permissions = usePermissions();
  const users = useUsers();
  const billing = useBilling();
  const settings = useConsultoraPositionSettings();
  const board = useBoardState();
  const [tab, setTab] = useState<Tab>("candidates");
  const [loading, setLoading] = useState(false);

  // Enlace directo desde las notificaciones: /consultora?tab=billing
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");

    if (requested === "billing" || requested === "positions" || requested === "candidates") {
      setTab(requested);
    }
  }, []);

  const candidatesLevel = levelOf(role, "consultora_candidates", permissions);
  const positionsLevel = levelOf(role, "consultora_positions", permissions);
  const billingLevel = levelOf(role, "charge_approval", permissions);

  const tabs: Tab[] = [
    ...(candidatesLevel !== "none" ? (["candidates"] as Tab[]) : []),
    ...(positionsLevel !== "none" ? (["positions"] as Tab[]) : []),
    ...(billingLevel !== "none" ? (["billing"] as Tab[]) : []),
  ];
  const activeTab: Tab = tabs.includes(tab) ? tab : tabs[0];

  const projects = board.orderedProjects;
  const company = users.find((item) => item.name === user)?.company ?? user;
  const isConsultora = role === "consultora";
  const directory = useMemo(() => buildCandidateDirectory(board.projectColumns), [board.projectColumns]);
  const openPositions = useMemo(() => listOpenPositions(projects, settings), [projects, settings]);
  const visiblePositions = isConsultora ? openPositions.filter((item) => !item.setting.hidden) : openPositions;
  const talents = users
    .filter((item) => item.status !== "disabled" && (item.role === "talent" || item.role === "admin"))
    .map((item) => item.name);

  if (tabs.length === 0) {
    return <NoAccessScreen area="the Consultora module" />;
  }

  const rows = listConsultoraCandidates(projects, isConsultora ? company : undefined);
  const hires = listConsultoraHires(projects, isConsultora ? company : undefined);
  const waitingApproval = billing.requests.filter((item) => item.status === "requested").length;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <CandidatesStyles />

      <div className="mx-auto max-w-[1300px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold app-text-primary">Consultora</h1>
            <p className="mt-3 max-w-2xl text-sm app-text-secondary">
              {isConsultora
                ? `Welcome, ${company}. Load profiles, follow their progress and request your billing.`
                : "Profiles loaded by consultoras, the positions they can see and their billing."}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <img src="/trick-studios-logo.png" alt="Trick Studios" className="h-12 w-auto" />
            <CurrentUserSwitcher />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {tabs.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={
                activeTab === key
                  ? { backgroundColor: "#7c3aed", color: "#ffffff", borderColor: "#7c3aed" }
                  : undefined
              }
              className="rounded-xl border px-4 py-2 text-sm font-semibold app-border app-text-secondary hover:border-violet-500"
            >
              {TAB_LABELS[key]}
              {key === "billing" && !isConsultora && waitingApproval > 0 ? ` (${waitingApproval})` : ""}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {activeTab === "candidates" &&
            (candidatesLevel === "own" ? (
              <MyCandidates rows={rows} openCount={visiblePositions.length} onLoad={() => setLoading(true)} />
            ) : (
              <InternalCandidates rows={rows} billing={billing} waitingApproval={waitingApproval} />
            ))}

          {activeTab === "positions" && (
            <ConsultoraPositions positions={isConsultora ? visiblePositions : openPositions} editable={positionsLevel === "full"} />
          )}

          {activeTab === "billing" &&
            (billingLevel === "own" ? (
              <ConsultoraBillingView company={company} user={user} hires={hires} billing={billing} talents={talents} />
            ) : (
              <TalentBillingView user={user} hires={hires} billing={billing} />
            ))}
        </div>
      </div>

      {loading && (
        <LoadProfileDialog
          company={company}
          openPositions={visiblePositions}
          directory={directory}
          onClose={() => setLoading(false)}
          onCreate={(open, payload) => {
            board.createCandidate(open.project.id, open.position.id, payload);

            if (open.position.owner && getRoleOf(open.position.owner) !== "consultora") {
              pushNotification({
                to: open.position.owner,
                from: company,
                kind: "info",
                state: "info",
                text: `${company} loaded ${payload.name} for ${open.position.title}.`,
                projectId: open.project.id,
                positionId: open.position.id,
                href: "/candidates",
              });
            }

            setLoading(false);
          }}
          onUpdate={(entry, updates) => {
            board.updateCandidate(entry.candidate.id, {
              ...updates,
              consultora: company,
              consultoraLoadedAt: today,
            });

            if (entry.candidate.recruiterOwner) {
              pushNotification({
                to: entry.candidate.recruiterOwner,
                from: company,
                kind: "info",
                state: "info",
                text: `${company} updated ${entry.candidate.name} (inactive for more than 6 months).`,
                candidateId: entry.candidate.id,
                candidateName: entry.candidate.name,
                href: `/candidates?open=${entry.candidate.id}`,
              });
            }

            setLoading(false);
          }}
        />
      )}
    </div>
  );
}
