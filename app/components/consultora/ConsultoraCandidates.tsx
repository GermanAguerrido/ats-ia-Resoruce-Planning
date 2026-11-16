"use client";

import Link from "next/link";

import type { CandidateMini, PositionCard, ProjectColumn } from "@/app/data/resourcePlanningMock";
import { PROCESS_STATUS_INFO, isHiredCandidate, isInProcessCandidate } from "@/app/lib/candidateStatus";
import {
  CONSULTORA_STEPS,
  consultoraStage,
  type BillingState,
} from "@/app/lib/consultora";
import { Card, Kpi } from "../dashboard/DashboardUi";
import { Tag } from "../candidates/CandidatesStyles";

type Row = { candidate: CandidateMini; position: PositionCard; project: ProjectColumn };

export function listConsultoraCandidates(projects: ProjectColumn[], company?: string): Row[] {
  return projects.flatMap((project) =>
    project.positions.flatMap((position) =>
      position.candidates
        .filter((candidate) => candidate.consultora && (!company || candidate.consultora === company))
        .map((candidate) => ({ candidate, position, project }))
    )
  );
}

function fmt(date?: string) {
  return date
    ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

/** Vista de la consultora: solo etapa y fecha de cada perfil que cargó. */
export function MyCandidates({
  rows,
  openCount,
  onLoad,
}: {
  rows: Row[];
  openCount: number;
  onLoad: () => void;
}) {
  const sorted = [...rows].sort((a, b) =>
    (b.candidate.consultoraLoadedAt ?? "").localeCompare(a.candidate.consultoraLoadedAt ?? "")
  );
  const stages = sorted.map((row) => ({ row, stage: consultoraStage(row.candidate) }));
  const feed = [...stages].sort((a, b) => b.stage.date.localeCompare(a.stage.date)).slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Profiles loaded" value={rows.length} />
        <Kpi label="In process" value={rows.filter((row) => isInProcessCandidate(row.candidate)).length} accent="text-sky-500" />
        <Kpi label="Hired" value={rows.filter((row) => isHiredCandidate(row.candidate)).length} accent="text-emerald-500" />
        <Kpi label="Open positions now" value={openCount} accent="text-amber-500" />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onLoad}
          style={{ backgroundColor: "#7c3aed", color: "#fff" }}
          className="rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90"
        >
          + Load profile
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="overflow-x-auto rounded-2xl border app-border app-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
                <th className="px-4 py-2.5 font-semibold">Candidate</th>
                <th className="px-4 py-2.5 font-semibold">Role</th>
                <th className="px-4 py-2.5 font-semibold">Progress</th>
                <th className="px-4 py-2.5 font-semibold">Stage</th>
                <th className="px-4 py-2.5 font-semibold">Since</th>
              </tr>
            </thead>

            <tbody>
              {stages.map(({ row, stage }) => (
                <tr key={`${row.position.id}-${row.candidate.id}`} className="border-t app-border">
                  <td className="px-4 py-2.5">
                    <p className="font-semibold app-text-primary">{row.candidate.name}</p>
                    <p className="text-xs app-text-muted">loaded {fmt(row.candidate.consultoraLoadedAt)}</p>
                  </td>
                  <td className="px-4 py-2.5 app-text-secondary">
                    {row.position.title}
                    <p className="text-xs app-text-muted">{row.position.seniority}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-[3px]">
                      {CONSULTORA_STEPS.map((step, index) => (
                        <i
                          key={step}
                          title={step}
                          className="block h-1.5 w-[22px] rounded-sm"
                          style={{
                            backgroundColor:
                              stage.state === "stopped"
                                ? "#ef4444"
                                : index <= stage.index
                                  ? stage.state === "hired"
                                    ? "#16a34a"
                                    : "#7c3aed"
                                  : "rgba(128,128,128,0.25)",
                          }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Tag tone={stage.state === "hired" ? "green" : stage.state === "stopped" ? "red" : stage.state === "hold" ? "amber" : "violet"} small>
                      {stage.label}
                    </Tag>
                  </td>
                  <td className="px-4 py-2.5 text-xs app-text-muted">{fmt(stage.date)}</td>
                </tr>
              ))}

              {stages.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm app-text-muted">
                    You have not loaded any profile yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Card title="Latest updates">
          {feed.length > 0 ? (
            feed.map(({ row, stage }) => (
              <div key={`${row.position.id}-${row.candidate.id}`} className="border-t px-5 py-2.5 text-sm app-border">
                <b className="app-text-primary">{row.candidate.name}</b>{" "}
                <span className="app-text-secondary">
                  {stage.state === "hired"
                    ? `was hired · start ${fmt(row.candidate.startDate)}`
                    : stage.state === "stopped"
                      ? "is not continuing"
                      : stage.state === "hold"
                        ? "is on hold"
                        : stage.index === 0
                          ? "was loaded"
                          : `moved to ${stage.label}`}
                </span>
                <p className="text-xs app-text-muted">{fmt(stage.date)}</p>
              </div>
            ))
          ) : (
            <p className="border-t px-5 py-5 text-center text-sm app-border app-text-muted">No updates yet.</p>
          )}
        </Card>
      </div>

      <ul className="list-disc space-y-1 rounded-xl border px-8 py-3 text-xs app-border app-text-muted">
        <li>Every profile you load goes straight to our central database, marked with your consultora.</li>
        <li>You see each step with its date: contacted, interviewed, internal tech interview, client process and hired.</li>
        <li>You never see notes, salaries, budgets or client names.</li>
      </ul>
    </div>
  );
}

/** Vista interna (Talent, Owner, Recruiters): todo lo que cargan las consultoras. */
export function InternalCandidates({
  rows,
  billing,
  waitingApproval,
}: {
  rows: Row[];
  billing: BillingState;
  waitingApproval: number;
}) {
  const sorted = [...rows].sort((a, b) =>
    (b.candidate.consultoraLoadedAt ?? "").localeCompare(a.candidate.consultoraLoadedAt ?? "")
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Loaded by consultoras" value={rows.length} />
        <Kpi label="In process" value={rows.filter((row) => isInProcessCandidate(row.candidate)).length} accent="text-sky-500" />
        <Kpi label="Hired" value={rows.filter((row) => isHiredCandidate(row.candidate)).length} accent="text-emerald-500" />
        <Kpi label="Billing waiting approval" value={waitingApproval} accent="text-amber-500" detail={`${billing.requests.length} requests in total`} />
      </div>

      <div className="overflow-x-auto rounded-2xl border app-border app-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
              <th className="px-4 py-2.5 font-semibold">Candidate</th>
              <th className="px-4 py-2.5 font-semibold">Position</th>
              <th className="px-4 py-2.5 font-semibold">Consultora</th>
              <th className="px-4 py-2.5 font-semibold">Loaded</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5 font-semibold">Recruiter</th>
            </tr>
          </thead>

          <tbody>
            {sorted.map(({ candidate, position, project }) => {
              const info = PROCESS_STATUS_INFO[candidate.processStatus];

              return (
                <tr key={`${position.id}-${candidate.id}`} className="border-t app-border">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/candidates?open=${encodeURIComponent(candidate.id)}`}
                      className="font-semibold app-text-primary hover:text-violet-500"
                    >
                      {candidate.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 app-text-secondary">
                    {position.title} · {position.seniority}
                    <p className="text-xs app-text-muted">{project.projectName}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <Tag tone="violet" small>
                      {candidate.consultora}
                    </Tag>
                  </td>
                  <td className="px-4 py-2.5 text-xs app-text-muted">{fmt(candidate.consultoraLoadedAt)}</td>
                  <td className="px-4 py-2.5">
                    <Tag tone={info.tone} small>
                      {info.label}
                    </Tag>
                  </td>
                  <td className="px-4 py-2.5 app-text-secondary">{candidate.recruiterOwner ?? "—"}</td>
                </tr>
              );
            })}

            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm app-text-muted">
                  No consultora has loaded profiles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ul className="list-disc space-y-1 rounded-xl border px-8 py-3 text-xs app-border app-text-muted">
        <li>Profiles loaded by a consultora go straight to the Candidates database with a “Consultora” tag. No review needed.</li>
        <li><b>First contact prevails</b>: if our team contacted the person first, the consultora cannot load it.</li>
        <li><b>6 months without contact</b>: the consultora can update the profile (salary, contact) and it counts for them.</li>
      </ul>
    </div>
  );
}

