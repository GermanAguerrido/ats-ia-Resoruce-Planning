"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArrowDownUp,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  FolderInput,
  Settings2,
  UserPlus,
  X,
} from "lucide-react";

import type { Candidate } from "@/app/types/candidate";
import type { PanelTab } from "./candidate-side-panel";

import { CandidateSidePanel } from "./candidate-side-panel";
import { CandidateStatusChip } from "./candidate-status-chip";
import { CandidateRowActions } from "./candidate-row-actions";

type Props = {
  candidates: Candidate[];
};

type SortKey =
  | "name"
  | "status"
  | "role"
  | "recruiterSeniority"
  | "technicalSeniority"
  | "english"
  | "recruiter"
  | "expectedSalary"
  | "updated";

type SortDirection = "asc" | "desc";

type ColumnKey =
  | "status"
  | "role"
  | "recruiterSeniority"
  | "technicalSeniority"
  | "english"
  | "recruiter"
  | "expectedSalary"
  | "tags"
  | "updated";

const candidateStatuses = [
  "Applied",
  "HR Interview",
  "Technical Interview",
  "Client Interview",
  "Offered",
  "Hired",
  "Discarded",
];

const configurableColumns: {
  key: ColumnKey;
  label: string;
}[] = [
  { key: "status", label: "Status" },
  { key: "role", label: "Role / Designation" },
  { key: "recruiterSeniority", label: "Recruiter Seniority" },
  { key: "technicalSeniority", label: "Technical Seniority" },
  { key: "english", label: "English" },
  { key: "recruiter", label: "Recruiter" },
  { key: "expectedSalary", label: "Expected Salary" },
  { key: "tags", label: "Tags" },
  { key: "updated", label: "Updated" },
];

const defaultVisibleColumns: Record<ColumnKey, boolean> = {
  status: true,
  role: true,
  recruiterSeniority: true,
  technicalSeniority: true,
  english: true,
  recruiter: true,
  expectedSalary: true,
  tags: true,
  updated: true,
};

function getExpectedSalary(candidate: Candidate) {
  if (!candidate.expectedSalary) {
    return "Not specified";
  }

  const cleanExpectedSalary = candidate.expectedSalary.trim();
  const currency = candidate.salaryCurrency?.trim();

  if (!currency) {
    return cleanExpectedSalary;
  }

  const alreadyHasCurrency = cleanExpectedSalary
    .toLowerCase()
    .startsWith(currency.toLowerCase());

  if (alreadyHasCurrency) {
    return cleanExpectedSalary;
  }

  return `${currency} ${cleanExpectedSalary}`;
}

function getTechnicalSeniority(candidate: Candidate) {
  return candidate.technicalSeniority || "Pending";
}

export function CandidateTable({ candidates }: Props) {
  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  const [activeTab, setActiveTab] = useState<PanelTab>("Overview");

  const [selectedCandidateNames, setSelectedCandidateNames] = useState<
    string[]
  >([]);

  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [stageOverrides, setStageOverrides] = useState<Record<string, string>>(
    {}
  );

  const [moveStageOpen, setMoveStageOpen] = useState(false);
  const [targetStage, setTargetStage] = useState("HR Interview");

  const [toastMessage, setToastMessage] = useState("");
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const displayCandidates = useMemo(() => {
    return candidates.map((candidate) => ({
      ...candidate,
      status: stageOverrides[candidate.name] ?? candidate.status,
    }));
  }, [candidates, stageOverrides]);

  function showToast(message: string) {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage("");
    }, 2500);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  function openCandidate(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setActiveTab("Overview");
  }

  function moveSingleCandidateStage(candidateName: string, status: string) {
    setStageOverrides((current) => ({
      ...current,
      [candidateName]: status,
    }));

    setSelectedCandidate((current) => {
      if (!current || current.name !== candidateName) {
        return current;
      }

      return {
        ...current,
        status,
      };
    });

    showToast(`${candidateName} moved to ${status}`);
  }

  function discardSingleCandidate(candidateName: string) {
    setStageOverrides((current) => ({
      ...current,
      [candidateName]: "Discarded",
    }));

    setSelectedCandidate((current) => {
      if (!current || current.name !== candidateName) {
        return current;
      }

      return {
        ...current,
        status: "Discarded",
      };
    });

    showToast(`${candidateName} discarded`);
  }

  const sortedCandidates = useMemo(() => {
    return [...displayCandidates].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      const aValue =
        sortKey === "technicalSeniority"
          ? getTechnicalSeniority(a)
          : sortKey === "expectedSalary"
            ? getExpectedSalary(a)
            : String(a[sortKey] ?? "");

      const bValue =
        sortKey === "technicalSeniority"
          ? getTechnicalSeniority(b)
          : sortKey === "expectedSalary"
            ? getExpectedSalary(b)
            : String(b[sortKey] ?? "");

      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  }, [displayCandidates, sortKey, sortDirection]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedCandidates.length / rowsPerPage)
  );

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedCandidates = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return sortedCandidates.slice(startIndex, endIndex);
  }, [sortedCandidates, safeCurrentPage, rowsPerPage]);

  const showingFrom =
    sortedCandidates.length === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage + 1;

  const showingTo = Math.min(
    safeCurrentPage * rowsPerPage,
    sortedCandidates.length
  );

  const allVisibleSelected =
    paginatedCandidates.length > 0 &&
    paginatedCandidates.every((candidate) =>
      selectedCandidateNames.includes(candidate.name)
    );

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedCandidateNames((current) =>
        current.filter(
          (name) =>
            !paginatedCandidates.some((candidate) => candidate.name === name)
        )
      );

      return;
    }

    setSelectedCandidateNames((current) => {
      const visibleNames = paginatedCandidates.map(
        (candidate) => candidate.name
      );

      return Array.from(new Set([...current, ...visibleNames]));
    });
  }

  function toggleCandidate(candidateName: string) {
    setSelectedCandidateNames((current) => {
      if (current.includes(candidateName)) {
        return current.filter((name) => name !== candidateName);
      }

      return [...current, candidateName];
    });
  }

  function clearSelection() {
    setSelectedCandidateNames([]);
  }

  function confirmMoveStage() {
    setStageOverrides((current) => {
      const next = { ...current };

      selectedCandidateNames.forEach((name) => {
        next[name] = targetStage;
      });

      return next;
    });

    showToast(
      `${selectedCandidateNames.length} candidate${
        selectedCandidateNames.length === 1 ? "" : "s"
      } moved to ${targetStage}`
    );

    setMoveStageOpen(false);
    setSelectedCandidateNames([]);
  }

  function simulateBulkAction(action: string) {
    showToast(
      `${selectedCandidateNames.length} candidate${
        selectedCandidateNames.length === 1 ? "" : "s"
      } ${action}`
    );

    setSelectedCandidateNames([]);
  }

  function toggleColumn(column: ColumnKey) {
    setVisibleColumns((current) => ({
      ...current,
      [column]: !current[column],
    }));
  }

  function resetColumns() {
    setVisibleColumns(defaultVisibleColumns);
  }

  function goToPreviousPage() {
    setCurrentPage((page) => Math.max(1, page - 1));
  }

  function goToNextPage() {
    setCurrentPage((page) => Math.min(totalPages, page + 1));
  }

  function changeRowsPerPage(value: number) {
    setRowsPerPage(value);
    setCurrentPage(1);
  }

  const SortButton = ({
    label,
    sort,
  }: {
    label: string;
    sort: SortKey;
  }) => (
    <button
      onClick={() => handleSort(sort)}
      className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide app-text-muted hover:underline"
    >
      {label}
      <ArrowDownUp className="h-3 w-3" />
    </button>
  );

  return (
    <>
      <div className="overflow-hidden rounded-2xl border shadow-sm app-card">
        <div className="flex items-center justify-between border-b px-5 py-4 app-border">
          <div>
            <h2 className="text-sm font-semibold app-text-primary">
              All candidates
            </h2>

            <p className="text-xs app-text-secondary">
              {displayCandidates.length} candidates across active searches
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => setColumnsOpen((current) => !current)}
              className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium app-card app-text-secondary hover:underline"
            >
              <Settings2 className="h-3.5 w-3.5" />
              Customize columns
            </button>

            {columnsOpen && (
              <div className="absolute right-0 top-9 z-40 w-72 rounded-2xl border p-3 shadow-2xl app-card">
                <div className="mb-3 flex items-center justify-between border-b pb-3 app-border">
                  <div>
                    <p className="text-sm font-medium app-text-primary">
                      Columns
                    </p>
                    <p className="text-xs app-text-secondary">
                      Choose table visibility
                    </p>
                  </div>

                  <button
                    onClick={() => setColumnsOpen(false)}
                    className="rounded-lg p-1.5 app-text-secondary hover:underline"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {configurableColumns.map((column) => (
                    <label
                      key={column.key}
                      className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm app-text-secondary hover:underline"
                    >
                      <span>{column.label}</span>

                      <input
                        type="checkbox"
                        checked={visibleColumns[column.key]}
                        onChange={() => toggleColumn(column.key)}
                        className="h-4 w-4 rounded"
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-3 border-t pt-3 app-border">
                  <button
                    onClick={resetColumns}
                    className="w-full rounded-xl border px-3 py-2 text-sm app-card app-text-secondary hover:underline"
                  >
                    Reset columns
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {sortedCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-24 text-center">
            <div className="max-w-md rounded-2xl border p-8 app-card">
              <p className="text-lg font-medium app-text-primary">
                No candidates found
              </p>

              <p className="mt-2 text-sm leading-6 app-text-secondary">
                Try clearing filters or searching by another candidate, skill,
                recruiter or role.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full min-w-[1500px] text-sm">
                <thead className="sticky top-0 z-10 text-left backdrop-blur-xl app-table-header">
                  <tr className="border-b app-border">
                    <th className="w-[44px] px-5 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded"
                      />
                    </th>

                    <th className="px-5 py-3">
                      <SortButton label="Candidate" sort="name" />
                    </th>

                    {visibleColumns.status && (
                      <th className="px-5 py-3">
                        <SortButton label="Status" sort="status" />
                      </th>
                    )}

                    {visibleColumns.role && (
                      <th className="px-5 py-3">
                        <SortButton label="Role" sort="role" />
                      </th>
                    )}

                    {visibleColumns.recruiterSeniority && (
                      <th className="px-5 py-3">
                        <SortButton
                          label="Recruiter Seniority"
                          sort="recruiterSeniority"
                        />
                      </th>
                    )}

                    {visibleColumns.technicalSeniority && (
                      <th className="px-5 py-3">
                        <SortButton
                          label="Technical Seniority"
                          sort="technicalSeniority"
                        />
                      </th>
                    )}

                    {visibleColumns.english && (
                      <th className="px-5 py-3">
                        <SortButton label="English" sort="english" />
                      </th>
                    )}

                    {visibleColumns.recruiter && (
                      <th className="px-5 py-3">
                        <SortButton label="Recruiter" sort="recruiter" />
                      </th>
                    )}

                    {visibleColumns.expectedSalary && (
                      <th className="px-5 py-3">
                        <SortButton
                          label="Expected Salary"
                          sort="expectedSalary"
                        />
                      </th>
                    )}

                    {visibleColumns.tags && (
                      <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-wide app-text-muted">
                        Tags
                      </th>
                    )}

                    {visibleColumns.updated && (
                      <th className="px-5 py-3">
                        <SortButton label="Updated" sort="updated" />
                      </th>
                    )}

                    <th className="w-[60px] px-5 py-3"></th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedCandidates.map((candidate) => {
                    const isSelected =
                      selectedCandidate?.name === candidate.name;

                    const isChecked = selectedCandidateNames.includes(
                      candidate.name
                    );

                    return (
                      <tr
                        key={candidate.name}
                        onClick={() => openCandidate(candidate)}
                        className={`cursor-pointer border-t transition-colors app-border ${
                          isSelected || isChecked ? "app-surface-muted" : ""
                        }`}
                      >
                        <td
                          className="px-5 py-3.5"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCandidate(candidate.name)}
                            className="h-4 w-4 rounded"
                          />
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold app-card app-text-primary">
                              {candidate.initials}
                            </div>

                            <div>
                              <div className="font-medium app-text-primary">
                                {candidate.name}
                              </div>

                              <div className="text-xs app-text-secondary">
                                {candidate.country} •{" "}
                                {candidate.yearsExperience || "Exp. pending"}
                              </div>

                              <div className="text-[11px] app-text-muted">
                                {candidate.availability}
                              </div>
                            </div>
                          </div>
                        </td>

                        {visibleColumns.status && (
                          <td className="px-5 py-3.5">
                            <CandidateStatusChip status={candidate.status} />
                          </td>
                        )}

                        {visibleColumns.role && (
                          <td className="px-5 py-3.5 app-text-secondary">
                            {candidate.designation || candidate.role}
                          </td>
                        )}

                        {visibleColumns.recruiterSeniority && (
                          <td className="px-5 py-3.5">
                            <span className="rounded-full border px-2.5 py-1 text-xs app-card app-text-secondary">
                              {candidate.recruiterSeniority ||
                                candidate.seniority}
                            </span>
                          </td>
                        )}

                        {visibleColumns.technicalSeniority && (
                          <td className="px-5 py-3.5">
                            {candidate.technicalSeniority ? (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700">
                                {candidate.technicalSeniority}
                              </span>
                            ) : (
                              <span className="rounded-full border px-2.5 py-1 text-xs app-card app-text-muted">
                                Pending
                              </span>
                            )}
                          </td>
                        )}

                        {visibleColumns.english && (
                          <td className="px-5 py-3.5 app-text-secondary">
                            {candidate.english}
                          </td>
                        )}

                        {visibleColumns.recruiter && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold app-card app-text-secondary">
                                {candidate.recruiterInitials}
                              </div>

                              <span className="app-text-primary">
                                {candidate.recruiter}
                              </span>
                            </div>
                          </td>
                        )}

                        {visibleColumns.expectedSalary && (
                          <td className="px-5 py-3.5 app-text-secondary">
                            {getExpectedSalary(candidate)}
                          </td>
                        )}

                        {visibleColumns.tags && (
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              {candidate.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border px-2.5 py-1 text-xs app-card app-text-secondary"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                        )}

                        {visibleColumns.updated && (
                          <td className="px-5 py-3.5 app-text-secondary">
                            {candidate.updated}
                          </td>
                        )}

                        <td
                          className="px-5 py-3.5 text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <CandidateRowActions />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t px-5 py-4 app-border md:flex-row md:items-center md:justify-between">
              <p className="text-sm app-text-secondary">
                Showing{" "}
                <span className="font-medium app-text-primary">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of{" "}
                <span className="font-medium app-text-primary">
                  {sortedCandidates.length}
                </span>{" "}
                candidates
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm app-text-secondary">Rows</span>

                  <select
                    value={rowsPerPage}
                    onChange={(event) =>
                      changeRowsPerPage(Number(event.target.value))
                    }
                    className="h-9 rounded-xl border px-3 text-sm outline-none app-input"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={safeCurrentPage === 1}
                    className="flex h-9 items-center gap-1 rounded-xl border px-3 text-sm app-card app-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="rounded-xl border px-3 py-2 text-sm app-card app-text-secondary">
                    Page{" "}
                    <span className="font-medium app-text-primary">
                      {safeCurrentPage}
                    </span>{" "}
                    / {totalPages}
                  </div>

                  <button
                    onClick={goToNextPage}
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-9 items-center gap-1 rounded-xl border px-3 text-sm app-card app-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedCandidateNames.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-[55] w-[calc(100%-3rem)] max-w-4xl -translate-x-1/2 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl app-card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="px-2">
              <p className="text-sm font-medium app-text-primary">
                {selectedCandidateNames.length} selected
              </p>

              <p className="text-xs app-text-secondary">
                Apply bulk actions to selected candidates
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMoveStageOpen(true)}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm app-card app-text-secondary"
              >
                <FolderInput className="h-4 w-4" />
                Move stage
              </button>

              <button
                onClick={() => simulateBulkAction("assigned")}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm app-card app-text-secondary"
              >
                <UserPlus className="h-4 w-4" />
                Assign
              </button>

              <button
                onClick={() => simulateBulkAction("exported")}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm app-card app-text-secondary"
              >
                <Download className="h-4 w-4" />
                Export
              </button>

              <button
                onClick={() => simulateBulkAction("archived")}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm app-card app-text-secondary"
              >
                <Archive className="h-4 w-4" />
                Archive
              </button>

              <button
                onClick={clearSelection}
                className="rounded-xl px-3 py-2 text-sm app-text-secondary hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {moveStageOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl app-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold app-text-primary">
                  Move candidates
                </h3>

                <p className="mt-1 text-sm app-text-secondary">
                  Move {selectedCandidateNames.length} selected candidate
                  {selectedCandidateNames.length === 1 ? "" : "s"} to a new
                  pipeline stage.
                </p>
              </div>

              <button
                onClick={() => setMoveStageOpen(false)}
                className="rounded-lg p-2 app-text-secondary hover:underline"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {candidateStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setTargetStage(status)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    targetStage === status
                      ? "app-button-primary"
                      : "app-card app-text-secondary"
                  }`}
                >
                  <span>{status}</span>

                  {targetStage === status && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setMoveStageOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm app-card app-text-secondary"
              >
                Cancel
              </button>

              <button
                onClick={confirmMoveStage}
                className="rounded-xl px-4 py-2 text-sm font-medium app-button-primary"
              >
                Move to {targetStage}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[70] rounded-xl border px-4 py-3 text-sm shadow-2xl app-card app-text-primary">
          {toastMessage}
        </div>
      )}

      {selectedCandidate && (
        <CandidateSidePanel
          candidate={{
            ...selectedCandidate,
            status:
              stageOverrides[selectedCandidate.name] ??
              selectedCandidate.status,
          }}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={() => setSelectedCandidate(null)}
          onMoveStage={moveSingleCandidateStage}
          onDiscardCandidate={discardSingleCandidate}
        />
      )}
    </>
  );
}