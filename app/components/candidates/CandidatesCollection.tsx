"use client";

import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, RefreshCw } from "lucide-react";
import {
  CONTACT_ALERT_DAYS,
  PROCESS_STATUS_INFO,
  daysSince,
  getDaysInProcess,
  isInProcessCandidate,
} from "@/app/lib/candidateStatus";
import {
  evaluateFit,
  formatMoney,
  type BudgetConfig,
  type CandidateFit,
} from "@/app/lib/candidateBudget";
import { notesSnippet } from "@/app/lib/candidateSearch";
import { isCompetitor } from "@/app/lib/companies";
import {
  isInternalRow,
  rowSeniority,
  type CandidateLink,
  type CandidateRow,
} from "@/app/lib/candidateRows";
import { Highlight, Tag } from "./CandidatesStyles";

export type CandidatesView = "compact" | "agile" | "full";
export type SortKey = "default" | "name" | "seniority" | "english" | "days" | "lastContact";
export type SortState = { key: SortKey; direction: 1 | -1 };

type Props = {
  rows: CandidateRow[];
  view: CandidatesView;
  query: string;
  notes: Map<string, string>;
  budget: BudgetConfig;
  sort: SortState;
  onSort: (key: SortKey) => void;
  onOpen: (link: CandidateLink) => void;
  onRecontact: (row: CandidateRow) => void;
};

function fitOf(row: CandidateRow, budget: BudgetConfig): CandidateFit {
  const link = row.links[0];

  return evaluateFit(row.main, budget, {
    position: link?.position,
    clientName: link?.project.clientName,
  });
}

function salaryTitle(fit: CandidateFit, margin: number) {
  const { amount, budget, diff } = fit.salary;

  if (amount === null) return "No expected salary loaded";
  if (budget === null) return "No budget loaded for this role and seniority";

  const sign = (diff ?? 0) > 0 ? "+" : "";

  return `Budget ${formatMoney(budget)} · ${sign}${formatMoney(diff)} (negotiable margin ${formatMoney(margin)})`;
}

function SalaryCell({
  row,
  fit,
  budget,
}: {
  row: CandidateRow;
  fit: CandidateFit;
  budget: BudgetConfig;
}) {
  return (
    <div>
      <span
        title={salaryTitle(fit, budget.margin)}
        className={`cd-sal ${
          fit.salary.level === "unknown" ? "app-text-secondary" : `cd-sal-${fit.salary.level}`
        }`}
      >
        {row.main.salaryExpected || "—"}
      </span>

      {(fit.belowSeniority || fit.belowEnglish) && (
        <div className="mt-1 flex flex-wrap gap-1">
          {fit.belowSeniority && (
            <Tag tone="red" small title={`The position asks for ${fit.requiredSeniority}`}>
              Below seniority
            </Tag>
          )}

          {fit.belowEnglish && (
            <Tag tone="red" small title={`The position asks for ${fit.requiredEnglish}`}>
              English below {fit.requiredEnglish}
            </Tag>
          )}
        </div>
      )}
    </div>
  );
}

function LastContact({ row, onRecontact }: { row: CandidateRow; onRecontact: () => void }) {
  const days = daysSince(row.main.lastContactAt);
  const old = days !== null && days >= CONTACT_ALERT_DAYS;
  const requested =
    Boolean(row.main.recontactRequestedAt) &&
    (days === null ||
      new Date(row.main.recontactRequestedAt as string).getTime() >
        new Date(row.main.lastContactAt as string).getTime());

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={old ? "cd-aging" : "app-text-secondary"}>
        {days === null ? "—" : days === 0 ? "Today" : `${days}d ago`}
      </span>

      {requested ? (
        <Tag tone="green" small title={`Requested by ${row.main.recontactRequestedBy ?? "someone"}`}>
          Recontact requested
        </Tag>
      ) : (
        old &&
        isInProcessCandidate(row.main) && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRecontact();
            }}
            className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold app-border app-text-secondary hover:border-violet-500 hover:text-violet-500"
          >
            <RefreshCw className="h-3 w-3" />
            Recontact
          </button>
        )
      )}
    </div>
  );
}

function StatusCell({ row }: { row: CandidateRow }) {
  if (isInternalRow(row)) {
    return <Tag tone="violet">Internal</Tag>;
  }

  const info = PROCESS_STATUS_INFO[row.main.processStatus];

  return <Tag tone={info.tone}>{info.label}</Tag>;
}

function PreviousCompanies({ row }: { row: CandidateRow }) {
  const companies = row.main.previousCompanies ?? [];

  if (companies.length === 0) {
    return <span className="app-text-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {companies.map((company) => (
        <Tag
          key={company}
          tone={isCompetitor(company) ? "amber" : "gray"}
          small
          title={isCompetitor(company) ? "Competitor" : undefined}
        >
          {isCompetitor(company) ? `ex-${company}` : company}
        </Tag>
      ))}
    </div>
  );
}

function SortHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
}) {
  const active = sort.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.direction === 1 ? ArrowUp : ArrowDown;

  return (
    <th className="whitespace-nowrap px-3 py-3">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide hover:underline"
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

function PlainHeader({ children }: { children: string }) {
  return (
    <th className="whitespace-nowrap px-3 py-3 text-[11px] font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}

function OpenInNewTab({ id }: { id: string }) {
  return (
    <a
      href={`/candidates?open=${encodeURIComponent(id)}`}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      title="Open in a new tab"
      className="rounded-md p-1 app-text-muted opacity-0 transition hover:text-violet-500 group-hover/row:opacity-100"
    >
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

export function CandidatesCollection(props: Props) {
  const { rows, view, query, notes, budget, sort, onSort, onOpen, onRecontact } = props;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border px-4 py-12 text-center app-border app-card app-text-muted">
        No candidates match the current filters
      </div>
    );
  }

  if (view === "agile") {
    return (
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {rows.map((row) => {
          const fit = fitOf(row, budget);
          const snippet = notesSnippet(notes.get(row.id) ?? "", query);

          return (
            <div
              key={row.id}
              onClick={() => onOpen(row.links[0])}
              className="group/row cursor-pointer rounded-xl border p-3 transition app-border app-card hover:border-violet-500"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold app-text-primary">
                  <Highlight text={row.main.name} term={query} />
                </span>
                <div className="flex items-center gap-1">
                  <OpenInNewTab id={row.id} />
                  <Tag tone="gray" small>
                    {rowSeniority(row) || "—"}
                  </Tag>
                </div>
              </div>

              <p className="mt-0.5 text-xs app-text-muted">
                {row.main.role} · {row.main.location}
              </p>

              {snippet && (
                <p className="mt-1.5 text-[11px] app-text-muted">
                  <Highlight text={snippet} term={query} />
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <StatusCell row={row} />
                <Tag tone="gray" small>
                  EN: {row.main.englishLevel || "—"}
                </Tag>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs app-text-secondary">
                <span>
                  {row.main.recruiterOwner || "No recruiter"} · {getDaysInProcess(row.main) ?? "—"}d
                </span>
                <SalaryCell row={row} fit={fit} budget={budget} />
              </div>

              {(row.main.previousCompanies?.length ?? 0) > 0 && (
                <div className="mt-2">
                  <PreviousCompanies row={row} />
                </div>
              )}

              <div className="mt-2">
                <LastContact row={row} onRecontact={() => onRecontact(row)} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const full = view === "full";
  const cell = full ? "px-3 py-3" : "px-3 py-2";

  return (
    <div className="overflow-auto rounded-2xl border app-border app-card">
      <table className="w-full min-w-[1150px] text-sm">
        <thead className="app-table-header">
          <tr className="text-left">
            <SortHeader label="Candidate" sortKey="name" sort={sort} onSort={onSort} />
            <PlainHeader>Position</PlainHeader>
            <SortHeader label="Seniority" sortKey="seniority" sort={sort} onSort={onSort} />
            {full && <PlainHeader>Location</PlainHeader>}
            <PlainHeader>Process status</PlainHeader>
            <SortHeader label="English" sortKey="english" sort={sort} onSort={onSort} />
            <PlainHeader>Recruiter</PlainHeader>
            <SortHeader label="Days in process" sortKey="days" sort={sort} onSort={onSort} />
            <SortHeader label="Last contact" sortKey="lastContact" sort={sort} onSort={onSort} />
            <PlainHeader>Expected salary</PlainHeader>
            {full && <PlainHeader>Previous company</PlainHeader>}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const fit = fitOf(row, budget);
            const days = getDaysInProcess(row.main);
            const snippet = notesSnippet(notes.get(row.id) ?? "", query);

            return (
              <tr
                key={row.id}
                onClick={() => onOpen(row.links[0])}
                className="group/row app-table-row cursor-pointer border-t app-border"
              >
                <td className={cell}>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold app-text-primary">
                      <Highlight text={row.main.name} term={query} />
                    </p>
                    <OpenInNewTab id={row.id} />
                  </div>

                  {snippet ? (
                    <p className="mt-0.5 max-w-[320px] text-[11px] app-text-muted">
                      HR notes: <Highlight text={snippet} term={query} />
                    </p>
                  ) : (
                    full &&
                    notes.get(row.id) && (
                      <p className="mt-0.5 line-clamp-2 max-w-[320px] text-[11px] app-text-muted">
                        {notes.get(row.id)}
                      </p>
                    )
                  )}
                </td>

                <td className={`${cell} app-text-secondary`}>
                  <span>{row.main.role}</span>
                  {row.links.length > 1 && (
                    <span
                      className="ml-1.5 text-[11px] app-text-muted"
                      title={row.links
                        .map((link) => `${link.project.projectName} · ${link.position.title}`)
                        .join("\n")}
                    >
                      +{row.links.length - 1}
                    </span>
                  )}
                </td>

                <td className={cell}>
                  <Tag tone="gray" small>
                    {rowSeniority(row) || "—"}
                  </Tag>
                </td>

                {full && <td className={`${cell} app-text-secondary`}>{row.main.location}</td>}

                <td className={cell}>
                  <StatusCell row={row} />
                </td>

                <td className={`${cell} app-text-secondary`}>{row.main.englishLevel || "—"}</td>

                <td className={`${cell} app-text-secondary`}>{row.main.recruiterOwner || "—"}</td>

                <td
                  className={`${cell} ${
                    days !== null && days >= 14 && isInProcessCandidate(row.main)
                      ? "cd-aging"
                      : "app-text-primary"
                  }`}
                >
                  {days ?? "—"}
                </td>

                <td className={cell}>
                  <LastContact row={row} onRecontact={() => onRecontact(row)} />
                </td>

                <td className={cell}>
                  <SalaryCell row={row} fit={fit} budget={budget} />
                </td>

                {full && (
                  <td className={cell}>
                    <PreviousCompanies row={row} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
