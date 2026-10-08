"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import type {
  CandidateMini,
  PositionCard as PositionCardType,
  ProjectColumn as ProjectColumnType,
  StageHistoryEntry,
} from "@/app/data/resourcePlanningMock";
import {
  INTERVIEW_LABELS,
  INTERVIEW_STAGES,
  PROCESS_STATUS_INFO,
  daysBetween,
  daysSince,
  formatDateTime,
  getStageHistory,
} from "@/app/lib/candidateStatus";
import { useInterviewers } from "@/app/hooks/useInterviewers";

type Change = (
  updates: Partial<CandidateMini>,
  activityText: string,
  timelineEntry?: { title: string; description: string }
) => void;

const STAGE_COLORS: Record<string, string> = {
  contacted: "#94a3b8",
  screening: "#60a5fa",
  tech_interview: "#a78bfa",
  presented: "#c4b5fd",
  client_interview: "#fbbf24",
  to_offer: "#fb923c",
  offer: "#f59e0b",
  hired: "#4ade80",
};

type InterviewRecord = {
  date: string;
  label: string;
  interviewer: string;
  where: string;
};

// Todas las entrevistas del candidato en todos sus procesos (misma persona = mismo id)
function buildInterviewRecord(
  candidate: CandidateMini,
  projects: ProjectColumnType[]
): InterviewRecord[] {
  const records: InterviewRecord[] = [];

  projects.forEach((project) =>
    project.positions.forEach((position) =>
      position.candidates
        .filter((item) => item.id === candidate.id)
        .forEach((item) =>
          getStageHistory(item).forEach((entry) => {
            if (!INTERVIEW_STAGES.includes(entry.status)) {
              return;
            }

            const interviewer =
              entry.interviewer ??
              (entry.status === "screening" ? item.recruiterOwner : undefined);

            if (!interviewer && !entry.scheduledFor) {
              return;
            }

            records.push({
              date: (entry.scheduledFor ?? entry.enteredAt).slice(0, 10),
              label: INTERVIEW_LABELS[entry.status] ?? "Interview",
              interviewer: interviewer ?? "—",
              where: `${project.clientName} · ${project.projectName} · ${position.title}`,
            });
          })
        )
    )
  );

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

// Fecha y hora de una entrevista (se puede cargar por adelantado)
function ScheduleCell({
  value,
  onSave,
}: {
  value?: string;
  onSave: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const changed = draft !== (value ?? "");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="datetime-local"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="app-input rounded-lg border px-2 py-1 text-xs outline-none"
        aria-label="Interview date and time"
      />

      {changed && draft && (
        <button
          type="button"
          onClick={() => onSave(draft)}
          className="rounded-lg border px-2 py-1 text-xs font-semibold app-border app-text-secondary hover:bg-black/[0.04]"
        >
          Save
        </button>
      )}
    </div>
  );
}

// Entrevistador: si el nombre está en la lista se asigna; si no, se agrega y se asigna
function InterviewerCell({
  value,
  names,
  onAssign,
  onAdd,
}: {
  value?: string;
  names: string[];
  onAssign: (name: string) => void;
  onAdd: (name: string) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const trimmed = draft.trim();
  const match = names.find((name) => name.toLowerCase() === trimmed.toLowerCase());
  const listId = useId();
  const changed = trimmed !== (value ?? "");

  const submit = () => {
    if (!trimmed) {
      return;
    }

    if (match) {
      onAssign(match);
    } else {
      onAdd(trimmed);
      onAssign(trimmed);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        list={listId}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            submit();
          }
        }}
        placeholder="Who interviews?"
        className="app-input w-[170px] rounded-lg border px-2 py-1 text-xs outline-none"
      />

      <datalist id={listId}>
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {trimmed && changed && (
        <button
          type="button"
          onClick={submit}
          className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold app-border app-text-secondary hover:bg-black/[0.04]"
        >
          {match ? (
            "Assign"
          ) : (
            <>
              <Plus className="h-3 w-3" />
              Add “{trimmed}”
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function CandidateStageHistory({
  candidate,
  position,
  project,
  allProjects,
  onChange,
}: {
  candidate: CandidateMini;
  position: PositionCardType;
  project: ProjectColumnType;
  allProjects: ProjectColumnType[];
  onChange: Change;
}) {
  const history = getStageHistory(candidate);
  const { names, addName } = useInterviewers();
  const today = new Date().toISOString().slice(0, 10);

  const entryDays = (entry: StageHistoryEntry) =>
    entry.leftAt ? daysBetween(entry.enteredAt, entry.leftAt) : (daysSince(entry.enteredAt) ?? 0);

  const totalDays = history.reduce((total, entry) => total + Math.max(entryDays(entry), 1), 0);

  const updateEntry = (
    index: number,
    patch: Partial<StageHistoryEntry>,
    activityText: string,
    timelineTitle: string
  ) => {
    onChange(
      {
        stageHistory: history.map((entry, entryIndex) =>
          entryIndex === index ? { ...entry, ...patch } : entry
        ),
      },
      activityText,
      { title: timelineTitle, description: activityText }
    );
  };

  const record = buildInterviewRecord(candidate, allProjects);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border app-border app-card">
        <div className="px-4 pt-4">
          <div className="flex h-8 overflow-hidden rounded-lg border app-border">
            {history.map((entry, index) => {
              const isCurrent = index === history.length - 1 && !entry.leftAt;
              const days = entryDays(entry);

              return (
                <div
                  key={`${entry.status}-${entry.enteredAt}-${index}`}
                  title={`${PROCESS_STATUS_INFO[entry.status].label} · ${days} days`}
                  className="flex items-center justify-center overflow-hidden whitespace-nowrap text-[11px] font-bold text-zinc-900"
                  style={{
                    width: `${(Math.max(days, 1) / totalDays) * 100}%`,
                    backgroundColor: STAGE_COLORS[entry.status] ?? "#f87171",
                    backgroundImage: isCurrent
                      ? "repeating-linear-gradient(45deg, rgba(255,255,255,.28) 0 6px, transparent 6px 12px)"
                      : undefined,
                  }}
                >
                  {PROCESS_STATUS_INFO[entry.status].label} · {days}d
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
                <th className="px-4 py-2 font-semibold">Stage</th>
                <th className="px-4 py-2 font-semibold">Entered</th>
                <th className="px-4 py-2 font-semibold">Days</th>
                <th className="px-4 py-2 font-semibold">Interview date</th>
                <th className="px-4 py-2 font-semibold">Interviewer</th>
                <th className="px-4 py-2 font-semibold">Client</th>
              </tr>
            </thead>

            <tbody>
              {history.map((entry, index) => {
                const isInterview = INTERVIEW_STAGES.includes(entry.status);
                const label = INTERVIEW_LABELS[entry.status] ?? PROCESS_STATUS_INFO[entry.status].label;

                return (
                  <tr key={`${entry.status}-${entry.enteredAt}-${index}`} className="border-t app-border">
                    <td className="px-4 py-2.5 font-medium app-text-primary">
                      {PROCESS_STATUS_INFO[entry.status].label}
                    </td>

                    <td className="px-4 py-2.5 app-text-secondary">{entry.enteredAt}</td>

                    <td className="px-4 py-2.5 app-text-secondary">
                      {entryDays(entry)}
                      {!entry.leftAt && entry.enteredAt <= today && (
                        <span className="ml-1.5 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold text-violet-500 app-border">
                          now
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      {isInterview ? (
                        <ScheduleCell
                          key={entry.scheduledFor ?? "none"}
                          value={entry.scheduledFor}
                          onSave={(next) =>
                            updateEntry(
                              index,
                              { scheduledFor: next },
                              `Scheduled the ${label.toLowerCase()} for ${formatDateTime(next)}.`,
                              "Interview scheduled"
                            )
                          }
                        />
                      ) : (
                        <span className="app-text-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5">
                      {entry.status === "screening" ? (
                        <span className="app-text-secondary">
                          {candidate.recruiterOwner ?? "—"}
                        </span>
                      ) : entry.status === "tech_interview" || entry.status === "client_interview" ? (
                        <InterviewerCell
                          key={entry.interviewer ?? "none"}
                          value={entry.interviewer}
                          names={names}
                          onAdd={addName}
                          onAssign={(name) =>
                            updateEntry(
                              index,
                              {
                                interviewer: name,
                                ...(entry.status === "client_interview"
                                  ? { clientName: entry.clientName ?? project.clientName }
                                  : {}),
                              },
                              `Set ${name} as interviewer for the ${label.toLowerCase()}.`,
                              "Interviewer assigned"
                            )
                          }
                        />
                      ) : (
                        <span className="app-text-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-2.5 app-text-secondary">
                      {entry.status === "client_interview"
                        ? (entry.clientName ?? project.clientName)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="px-4 py-3 text-xs app-text-muted">
          Each status change saves its date. In {position.title}, this candidate has been in{" "}
          {history.length} {history.length === 1 ? "stage" : "stages"}.
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide app-text-muted">
          Interview record (all processes)
        </p>

        <div className="overflow-hidden rounded-xl border app-border app-card">
          {record.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
                  <th className="px-4 py-2 font-semibold">Date</th>
                  <th className="px-4 py-2 font-semibold">Interview</th>
                  <th className="px-4 py-2 font-semibold">Interviewer</th>
                  <th className="px-4 py-2 font-semibold">Client · Project · Position</th>
                </tr>
              </thead>

              <tbody>
                {record.map((item, index) => (
                  <tr key={`${item.date}-${item.label}-${index}`} className="border-t app-border">
                    <td className="px-4 py-2.5 app-text-secondary">{item.date}</td>
                    <td className="px-4 py-2.5 app-text-primary">{item.label}</td>
                    <td className="px-4 py-2.5 app-text-secondary">{item.interviewer}</td>
                    <td className="px-4 py-2.5 app-text-secondary">{item.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-5 text-center text-sm app-text-muted">
              No interviews recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}