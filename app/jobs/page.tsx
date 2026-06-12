"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ResourcePlanningBoard } from "@/app/components/resource-planning/ResourcePlanningBoard";
import { jobs } from "../data/jobs";
import type { JobStatus } from "../types/job";
import {
  ASAP_RISK_THRESHOLD_DAYS,
  getJobWithRisk,
  INTERNAL_ASAP_TARGET_DAYS,
  deadlineTypeClassName,
  deadlineTypeText,
  formatDate,
  priorityClassName,
  priorityText,
  riskClassName,
  riskText,
  statusClassName,
  statusText,
} from "../utils/jobs";

const statusFilters: Array<"all" | JobStatus> = [
  "all",
  "open",
  "completed",
  "on_hold",
  "closed",
];

const statusLabels: Record<"all" | JobStatus, string> = {
  all: "All",
  open: "Open",
  completed: "Completed",
  on_hold: "On Hold",
  closed: "Closed",
};

type ViewMode = "resource_planning" | "positions_table";

export default function OpenPositionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | JobStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("resource_planning");

  const jobsWithRisk = useMemo(() => {
    return jobs.map((job) => getJobWithRisk(job));
  }, []);

  const filteredJobs = useMemo(() => {
    return jobsWithRisk.filter((job) => {
      const normalizedSearch = search.toLowerCase();

      const matchesSearch =
        job.client.toLowerCase().includes(normalizedSearch) ||
        job.project.toLowerCase().includes(normalizedSearch) ||
        job.position.toLowerCase().includes(normalizedSearch) ||
        job.seniority.toLowerCase().includes(normalizedSearch) ||
        job.requiredSkills.some((skill) =>
          skill.toLowerCase().includes(normalizedSearch)
        );

      const matchesStatus =
        statusFilter === "all" || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [jobsWithRisk, search, statusFilter]);

  const totalPositionsCount = jobs.length;

  const openPositionsCount = jobs.filter((job) => job.status === "open").length;

  const completedPositionsCount = jobs.filter(
    (job) => job.status === "completed"
  ).length;

  const totalHeadcount = jobs.reduce((acc, job) => acc + job.quantity, 0);

  const openHighPriorityCount = jobsWithRisk.filter(
    (job) => job.status === "open" && job.priority === "high"
  ).length;

  const atRiskCount = jobsWithRisk.filter(
    (job) => job.risk === "at_risk"
  ).length;

  const overdueCount = jobsWithRisk.filter(
    (job) => job.risk === "overdue"
  ).length;

  return (
    <div className="min-h-screen app-bg px-6 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold app-text-primary">
              Resource Planning
            </h1>
            <p className="mt-1 text-sm app-text-secondary">
              Manage client projects, open roles, candidate allocation,
              deadlines and recruiting priorities.
            </p>
          </div>

          <button className="rounded-xl px-4 py-2 text-sm font-medium app-button-primary">
            + New Position
          </button>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border p-2 shadow-sm app-card">
          <button
            onClick={() => setViewMode("resource_planning")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              viewMode === "resource_planning"
                ? "app-button-primary"
                : "app-text-secondary hover:bg-white/5"
            }`}
          >
            Resource Planning
          </button>

          <button
            onClick={() => setViewMode("positions_table")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              viewMode === "positions_table"
                ? "app-button-primary"
                : "app-text-secondary hover:bg-white/5"
            }`}
          >
            Positions Table
          </button>
        </div>

        {viewMode === "resource_planning" && (
          <div className="overflow-hidden rounded-2xl border shadow-sm app-card">
            <ResourcePlanningBoard />
          </div>
        )}

        {viewMode === "positions_table" && (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-2xl border p-4 shadow-sm app-card">
                <p className="text-sm app-text-secondary">Total Positions</p>
                <p className="mt-2 text-2xl font-bold app-text-primary">
                  {totalPositionsCount}
                </p>
              </div>

              <div className="rounded-2xl border p-4 shadow-sm app-card">
                <p className="text-sm app-text-secondary">Open Positions</p>
                <p className="mt-2 text-2xl font-bold app-text-primary">
                  {openPositionsCount}
                </p>
              </div>

              <div className="rounded-2xl border p-4 shadow-sm app-card">
                <p className="text-sm app-text-secondary">Completed</p>
                <p className="mt-2 text-2xl font-bold app-text-primary">
                  {completedPositionsCount}
                </p>
              </div>

              <div className="rounded-2xl border p-4 shadow-sm app-card">
                <p className="text-sm app-text-secondary">Total Headcount</p>
                <p className="mt-2 text-2xl font-bold app-text-primary">
                  {totalHeadcount}
                </p>
              </div>

              <div className="rounded-2xl border p-4 shadow-sm app-card">
                <p className="text-sm app-text-secondary">Open High Priority</p>
                <p className="mt-2 text-2xl font-bold app-text-primary">
                  {openHighPriorityCount}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border p-4 shadow-sm app-card">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by client, project, position, seniority or skill..."
                  className="w-full rounded-xl border px-4 py-2 text-sm outline-none md:max-w-xl app-input"
                />

                <div className="flex flex-wrap gap-2">
                  {statusFilters.map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ${
                        statusFilter === status
                          ? "app-button-primary"
                          : "border app-card app-text-secondary hover:app-surface-muted"
                      }`}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {(atRiskCount > 0 || overdueCount > 0) && (
              <div className="grid gap-4 md:grid-cols-2">
                {atRiskCount > 0 && (
                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                    <p className="text-sm font-medium text-yellow-900">
                      {atRiskCount} open position
                      {atRiskCount > 1 ? "s are" : " is"} at risk and should be
                      reviewed.
                    </p>
                  </div>
                )}

                {overdueCount > 0 && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium text-red-800">
                      {overdueCount} open position
                      {overdueCount > 1 ? "s are" : " is"} overdue and need
                      immediate action.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border shadow-sm app-card">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y text-sm app-border">
                  <thead className="app-table-header">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Position
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Seniority
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Deadline Type
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Target Date
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Risk</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y app-border">
                    {filteredJobs.map((job) => (
                      <tr
                        key={job.id}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="cursor-pointer transition app-table-row"
                        title="Click to view position details"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-medium app-text-primary">
                          {job.client}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 app-text-secondary">
                          {job.project}
                        </td>

                        <td className="min-w-[300px] px-4 py-4">
                          <div>
                            <p className="font-medium app-text-primary">
                              {job.position}
                            </p>

                            <p className="mt-1 line-clamp-1 text-xs app-text-secondary">
                              {job.jdSummary}
                            </p>

                            {job.statusNote && (
                              <p className="mt-1 line-clamp-1 text-xs app-text-muted">
                                Note: {job.statusNote}
                              </p>
                            )}

                            {job.completedCandidateName && (
                              <p className="mt-1 text-xs text-violet-700">
                                Hired: {job.completedCandidateName}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 app-text-secondary">
                          {job.seniority}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 app-text-secondary">
                          {formatDate(job.startDate)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              deadlineTypeClassName[job.deadlineType]
                            }`}
                          >
                            {deadlineTypeText[job.deadlineType]}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 app-text-secondary">
                          <div>
                            <p>{formatDate(job.targetDate)}</p>
                            <p className="mt-1 text-xs app-text-muted">
                              {job.targetDateLabel}
                            </p>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {job.risk ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                riskClassName[job.risk]
                              }`}
                            >
                              {riskText[job.risk]}
                            </span>
                          ) : (
                            <span className="text-xs app-text-muted">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              priorityClassName[job.priority]
                            }`}
                          >
                            {priorityText[job.priority]}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-medium app-text-primary">
                          {job.quantity}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div>
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                statusClassName[job.status]
                              }`}
                            >
                              {statusText[job.status]}
                            </span>

                            {job.statusChangedAt && (
                              <p className="mt-1 text-xs app-text-muted">
                                {formatDate(job.statusChangedAt)}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredJobs.length === 0 && (
                <div className="p-10 text-center">
                  <p className="text-sm font-medium app-text-primary">
                    No positions found.
                  </p>
                  <p className="mt-1 text-sm app-text-secondary">
                    Try changing the search or status filter.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border p-4 shadow-sm app-card">
              <h2 className="text-sm font-semibold app-text-primary">
                Risk calculation rules
              </h2>

              <div className="mt-3 grid gap-3 text-sm app-text-secondary md:grid-cols-3">
                <div className="rounded-xl border p-3 app-card">
                  <p className="font-medium app-text-primary">Fixed Date</p>
                  <p className="mt-1">
                    Uses the client deadline. At Risk starts 7 days before the
                    deadline. Overdue starts after the deadline.
                  </p>
                </div>

                <div className="rounded-xl border p-3 app-card">
                  <p className="font-medium app-text-primary">ASAP</p>
                  <p className="mt-1">
                    Uses an internal target of {INTERNAL_ASAP_TARGET_DAYS} days
                    from start date. At Risk starts {ASAP_RISK_THRESHOLD_DAYS}{" "}
                    days before the internal target.
                  </p>
                </div>

                <div className="rounded-xl border p-3 app-card">
                  <p className="font-medium app-text-primary">
                    Completed / On Hold / Closed
                  </p>
                  <p className="mt-1">
                    These statuses do not calculate active risk. Status date and
                    notes are used to keep tracking history.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}