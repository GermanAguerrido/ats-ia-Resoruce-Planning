"use client";

import { useMemo, useState } from "react";
import type { CandidateMini, PositionCard, ProjectColumn } from "@/app/data/resourcePlanningMock";
import {
  extractKeywords,
  isRelevantForPosition,
  scoreCandidate,
  usePositionJd,
  type MatchScore,
} from "@/app/lib/aiMatch";
import { formatMoney, lookupBudget, type BudgetConfig } from "@/app/lib/candidateBudget";
import { isInternalRow, type CandidateLink, type CandidateRow } from "@/app/lib/candidateRows";
import { seniorityBand } from "@/app/lib/roles";
import { Tag } from "./CandidatesStyles";

type OpenPosition = { project: ProjectColumn; position: PositionCard };

type Props = {
  projects: ProjectColumn[];
  rows: CandidateRow[];
  notes: Map<string, string>;
  budget: BudgetConfig;
  onOpen: (link: CandidateLink) => void;
  onAddToPosition: (projectId: string, positionId: string, candidate: CandidateMini) => void;
};

const MAX_RESULTS = 10;

function scoreColor(total: number) {
  return total >= 75 ? "#16a34a" : total >= 55 ? "#d97706" : "#dc2626";
}

/** Cruza la JD de una posición abierta con la base de candidatos y los ordena por ajuste. */
export function AiMatchPanel({ projects, rows, notes, budget, onOpen, onAddToPosition }: Props) {
  const openPositions = useMemo<OpenPosition[]>(
    () =>
      projects.flatMap((project) =>
        project.positions
          .filter((position) => position.status === "open")
          .map((position) => ({ project, position }))
      ),
    [projects]
  );

  const [selectedId, setSelectedId] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const selected = openPositions.find((item) => item.position.id === selectedId) ?? openPositions[0];
  const [jd, setJd] = usePositionJd(selected?.position.id ?? "none");

  const keywords = useMemo(
    () => (selected ? extractKeywords(jd, selected.position.title) : []),
    [jd, selected]
  );

  const results = useMemo(() => {
    if (!selected) {
      return [];
    }

    const list: Array<{ row: CandidateRow; score: MatchScore }> = [];

    rows.forEach((row) => {
      if (isInternalRow(row)) {
        return;
      }

      const score = scoreCandidate({
        candidate: row.main,
        notes: notes.get(row.id) ?? "",
        keywords,
        position: selected.position,
        clientName: selected.project.clientName,
        config: budget,
      });

      if (isRelevantForPosition(row.main, selected.position, score)) {
        list.push({ row, score });
      }
    });

    return list.sort((a, b) => b.score.total - a.score.total).slice(0, MAX_RESULTS);
  }, [rows, notes, keywords, selected, budget]);

  if (!selected) {
    return (
      <div className="rounded-2xl border px-4 py-12 text-center app-border app-card app-text-muted">
        There are no open positions to match against.
      </div>
    );
  }

  const { project, position } = selected;
  const positionBudget = lookupBudget(
    budget,
    position.title,
    seniorityBand(position.seniority),
    project.clientName
  );

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(280px, 340px) 1fr" }}>
      <section className="rounded-2xl border p-4 app-border app-card">
        <h2 className="mb-2 text-sm font-semibold app-text-primary">Open position</h2>

        <select
          value={position.id}
          onChange={(event) => setSelectedId(event.target.value)}
          className="app-input mb-3 w-full rounded-xl border px-3 py-2 text-sm"
        >
          {openPositions.map((item) => (
            <option key={item.position.id} value={item.position.id}>
              {item.position.title} · {item.position.seniority} · {item.project.clientName}
            </option>
          ))}
        </select>

        <label className="text-xs font-semibold app-text-secondary" htmlFor="ai-match-jd">
          Job description (JD)
        </label>
        <textarea
          id="ai-match-jd"
          value={jd}
          onChange={(event) => setJd(event.target.value)}
          placeholder={"Paste the JD here.\nTip: a line like “Must: Unity, C#, multiplayer” sets the exact skills to look for."}
          className="app-input mt-1 min-h-[150px] w-full resize-y rounded-xl border px-3 py-2 text-xs leading-5"
        />

        <div className="mt-2 flex flex-wrap gap-1.5">
          {keywords.map((word) => (
            <Tag key={word} tone="violet" small>
              {word}
            </Tag>
          ))}
        </div>

        <p className="mt-3 text-xs app-text-muted">
          Budget: <b className="app-text-primary">{formatMoney(positionBudget)}</b> (+
          {formatMoney(budget.margin)} negotiable) · English:{" "}
          {(seniorityBand(position.seniority) && budget.englishMin[seniorityBand(position.seniority) as keyof typeof budget.englishMin]) || "—"}
          +
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold app-text-primary">
          Best matches in the database{" "}
          <span className="text-xs font-normal app-text-muted">· JD against role and HR notes</span>
        </h2>

        {results.length === 0 && (
          <div className="rounded-2xl border px-4 py-10 text-center text-sm app-border app-card app-text-muted">
            No candidates look close to this position yet.
          </div>
        )}

        <div className="space-y-2">
          {results.map(({ row, score }) => {
            const alreadyIn = row.links.some((link) => link.position.id === position.id);
            const wasAdded = added.includes(row.id);

            return (
              <div key={row.id} className="flex items-start gap-3 rounded-xl border p-3 app-border app-card">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-base font-extrabold"
                  style={{ border: `4px solid ${scoreColor(score.total)}` }}
                >
                  {score.total}
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onOpen(row.links[0])}
                    className="font-semibold app-text-primary hover:underline"
                  >
                    {row.main.name}
                  </button>
                  <span className="ml-2 text-xs app-text-muted">
                    {row.main.role} · {row.main.seniority || row.links[0]?.position.seniority}
                  </span>

                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {score.haveSkills.map((word) => (
                      <Tag key={word} tone="green" small>
                        ✓ {word}
                      </Tag>
                    ))}
                    {score.missingSkills.map((word) => (
                      <Tag key={word} tone="gray" small>
                        · {word}
                      </Tag>
                    ))}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Tag tone={score.seniorityOk ? "green" : "red"} small>
                      {score.seniorityOk ? "Seniority ok" : "Below seniority"}
                    </Tag>
                    <Tag tone={score.englishOk ? "green" : "red"} small>
                      English: {row.main.englishLevel || "—"}
                    </Tag>
                    <Tag
                      tone={
                        score.salaryLevel === "ok"
                          ? "green"
                          : score.salaryLevel === "negotiable"
                            ? "amber"
                            : score.salaryLevel === "over"
                              ? "red"
                              : "gray"
                      }
                      small
                    >
                      {row.main.salaryExpected || "No salary"}
                      {score.salaryLevel === "negotiable" ? " · negotiable" : ""}
                      {score.salaryLevel === "over" ? " · over budget" : ""}
                    </Tag>
                  </div>
                </div>

                {alreadyIn || wasAdded ? (
                  <Tag tone="gray" small>
                    {alreadyIn ? "Already in position" : "Added"}
                  </Tag>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onAddToPosition(project.id, position.id, row.main);
                      setAdded((current) => [...current, row.id]);
                    }}
                    style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90"
                  >
                    Add to position
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
