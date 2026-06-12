"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { jobs } from "../../data/jobs";
import { jobApplications } from "../../data/jobApplications";
import type {
  JobApplicationStage,
  JobApplicationStatus,
} from "../../types/jobApplication";
import {
  ASAP_RISK_THRESHOLD_DAYS,
  FIXED_DATE_RISK_THRESHOLD_DAYS,
  INTERNAL_ASAP_TARGET_DAYS,
  deadlineTypeClassName,
  deadlineTypeText,
  formatDate,
  getJobWithRisk,
  priorityClassName,
  priorityText,
  riskClassName,
  riskText,
  statusClassName,
  statusText,
} from "../../utils/jobs";

const applicationStageText: Record<JobApplicationStage, string> = {
  sourced: "Sourced",
  recruiter_screen: "Recruiter Screen",
  technical_interview: "Technical Interview",
  client_review: "Client Review",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const applicationStageClassName: Record<JobApplicationStage, string> = {
  sourced: "bg-gray-100 text-gray-700",
  recruiter_screen: "bg-blue-100 text-blue-700",
  technical_interview: "bg-purple-100 text-purple-700",
  client_review: "bg-amber-100 text-amber-700",
  offer: "bg-orange-100 text-orange-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const applicationStatusText: Record<JobApplicationStatus, string> = {
  active: "Active",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const applicationStatusClassName: Record<JobApplicationStatus, string> = {
  active: "bg-blue-100 text-blue-700",
  hired: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
};

function getMatchScoreClassName(matchScore: number) {
  if (matchScore >= 80) {
    return "bg-green-100 text-green-700";
  }

  if (matchScore >= 65) {
    return "bg-yellow-100 text-yellow-800";
  }

  return "bg-red-100 text-red-700";
}

export default function PositionDetailPage() {
  const params = useParams();
  const jobIdParam = params.jobId;
  const jobId = Array.isArray(jobIdParam) ? jobIdParam[0] : jobIdParam;

  const baseJob = jobs.find((currentJob) => currentJob.id === jobId);

  if (!baseJob) {
    return (
      <div className="min-h-screen app-bg px-6 py-6">
        <div className="rounded-2xl border p-8 shadow-sm app-card">
          <p className="text-sm font-medium app-text-secondary">
            Position not found
          </p>

          <h1 className="mt-2 text-2xl font-bold app-text-primary">
            We could not find this position.
          </h1>

          <Link
            href="/jobs"
            className="mt-6 inline-flex rounded-xl px-4 py-2 text-sm font-medium app-button-primary"
          >
            Back to Open Positions
          </Link>
        </div>
      </div>
    );
  }

  const job = getJobWithRisk(baseJob);

  const applicationsForJob = jobApplications.filter(
    (application) => application.jobId === job.id
  );

  const activeApplicationsCount = applicationsForJob.filter(
    (application) => application.status === "active"
  ).length;

  const hiredApplicationsCount = applicationsForJob.filter(
    (application) => application.status === "hired"
  ).length;

  const rejectedApplicationsCount = applicationsForJob.filter(
    (application) => application.status === "rejected"
  ).length;

  const averageMatchScore =
    applicationsForJob.length > 0
      ? Math.round(
          applicationsForJob.reduce(
            (acc, application) => acc + application.matchScore,
            0
          ) / applicationsForJob.length
        )
      : 0;

  return (
    <div className="min-h-screen app-bg px-6 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/jobs"
              className="text-sm font-medium app-text-secondary hover:underline"
            >
              ← Back to Open Positions
            </Link>

            <h1 className="mt-3 text-2xl font-bold app-text-primary">
              {job.position}
            </h1>

            <p className="mt-1 text-sm app-text-secondary">
              {job.client} · {job.project}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {job.risk ? (
              <span
                className={`inline-flex rounded-full px-3 py-2 text-sm font-medium ${
                  riskClassName[job.risk]
                }`}
              >
                {riskText[job.risk]}
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500">
                No active risk
              </span>
            )}

            <span
              className={`inline-flex rounded-full px-3 py-2 text-sm font-medium ${
                statusClassName[job.status]
              }`}
            >
              {statusText[job.status]}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Seniority</p>
            <p className="mt-2 text-xl font-bold app-text-primary">
              {job.seniority}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Quantity</p>
            <p className="mt-2 text-xl font-bold app-text-primary">
              {job.quantity}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Priority</p>
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                priorityClassName[job.priority]
              }`}
            >
              {priorityText[job.priority]}
            </span>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Deadline Type</p>
            <span
              className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                deadlineTypeClassName[job.deadlineType]
              }`}
            >
              {deadlineTypeText[job.deadlineType]}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border p-5 shadow-sm app-card lg:col-span-2">
            <h2 className="text-base font-semibold app-text-primary">
              Position Overview
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Client
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {job.client}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Project
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {job.project}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Start Date
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {formatDate(job.startDate)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Target Date
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {formatDate(job.targetDate)}
                </p>
                <p className="mt-1 text-xs app-text-muted">
                  {job.targetDateLabel}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Days Until Target
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {job.status === "open"
                    ? job.daysUntilTarget >= 0
                      ? `${job.daysUntilTarget} days remaining`
                      : `${Math.abs(job.daysUntilTarget)} days overdue`
                    : "Not applicable"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Status
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    statusClassName[job.status]
                  }`}
                >
                  {statusText[job.status]}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                JD Summary
              </p>
              <p className="mt-2 text-sm leading-6 app-text-secondary">
                {job.jdSummary}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm app-card">
            <h2 className="text-base font-semibold app-text-primary">
              Status Tracking
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Current Status
                </p>
                <span
                  className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    statusClassName[job.status]
                  }`}
                >
                  {statusText[job.status]}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Status Changed At
                </p>
                <p className="mt-1 text-sm app-text-secondary">
                  {job.statusChangedAt ? formatDate(job.statusChangedAt) : "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Status Note
                </p>
                <p className="mt-1 text-sm leading-6 app-text-secondary">
                  {job.statusNote || "No status note added."}
                </p>
              </div>

              {job.completedCandidateName && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                    Hired Candidate
                  </p>
                  <p className="mt-1 text-sm font-medium text-violet-700">
                    {job.completedCandidateName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Assigned Candidates</p>
            <p className="mt-2 text-2xl font-bold app-text-primary">
              {applicationsForJob.length}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Active</p>
            <p className="mt-2 text-2xl font-bold app-text-primary">
              {activeApplicationsCount}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Hired</p>
            <p className="mt-2 text-2xl font-bold app-text-primary">
              {hiredApplicationsCount}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Average Match</p>
            <p className="mt-2 text-2xl font-bold app-text-primary">
              {applicationsForJob.length > 0 ? `${averageMatchScore}%` : "—"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border p-5 shadow-sm app-card">
            <h2 className="text-base font-semibold app-text-primary">
              Required Skills
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm app-card">
            <h2 className="text-base font-semibold app-text-primary">
              Pipeline Summary
            </h2>

            <div className="mt-4 space-y-3">
              {Object.entries(applicationStageText).map(([stage, label]) => {
                const count = applicationsForJob.filter(
                  (application) => application.stage === stage
                ).length;

                return (
                  <div
                    key={stage}
                    className="flex items-center justify-between rounded-xl border px-3 py-2 app-card"
                  >
                    <span className="text-sm app-text-secondary">{label}</span>
                    <span className="text-sm font-semibold app-text-primary">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border shadow-sm app-card">
          <div className="flex flex-col gap-2 border-b px-5 py-4 app-border md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-base font-semibold app-text-primary">
                Candidate Pipeline
              </h2>
              <p className="mt-1 text-sm app-text-secondary">
                Candidates assigned to this position with pipeline stage, match
                score and last activity.
              </p>
            </div>

            <button className="rounded-xl px-4 py-2 text-sm font-medium app-button-primary">
              + Assign Candidate
            </button>
          </div>

          {applicationsForJob.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y text-sm app-border">
                <thead className="app-table-header">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Candidate
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Stage</th>
                    <th className="px-4 py-3 text-left font-medium">Match</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Last Activity
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Notes</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y app-border">
                  {applicationsForJob.map((application) => (
                    <tr
                      key={application.id}
                      className="transition app-table-row"
                    >
                      <td className="whitespace-nowrap px-4 py-4 font-medium app-text-primary">
                        <Link
                          href={`/candidates/${application.candidateId}`}
                          className="hover:underline"
                        >
                          {application.candidateName}
                        </Link>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 app-text-secondary">
                        {application.candidateRole}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            applicationStageClassName[application.stage]
                          }`}
                        >
                          {applicationStageText[application.stage]}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getMatchScoreClassName(
                            application.matchScore
                          )}`}
                        >
                          {application.matchScore}%
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            applicationStatusClassName[application.status]
                          }`}
                        >
                          {applicationStatusText[application.status]}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 app-text-secondary">
                        {formatDate(application.lastActivityAt)}
                      </td>

                      <td className="min-w-[320px] px-4 py-4 app-text-secondary">
                        {application.notes || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/candidates/${application.candidateId}`}
                            className="rounded-lg border px-3 py-1.5 text-xs font-medium app-card app-text-secondary hover:underline"
                          >
                            View
                          </Link>

                          <button className="rounded-lg border px-3 py-1.5 text-xs font-medium app-card app-text-secondary">
                            Move Stage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="text-sm font-medium app-text-primary">
                No candidates assigned yet.
              </p>
              <p className="mt-1 text-sm app-text-secondary">
                Use this section to connect candidates to this open position.
              </p>
            </div>
          )}
        </div>

        {rejectedApplicationsCount > 0 && (
          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">
              This position has{" "}
              <span className="font-semibold app-text-primary">
                {rejectedApplicationsCount}
              </span>{" "}
              rejected candidate{rejectedApplicationsCount > 1 ? "s" : ""}.
            </p>
          </div>
        )}

        <div className="rounded-2xl border p-5 shadow-sm app-card">
          <h2 className="text-base font-semibold app-text-primary">
            Risk Calculation
          </h2>

          <div className="mt-4 grid gap-3 text-sm app-text-secondary md:grid-cols-3">
            <div className="rounded-xl border p-3 app-card">
              <p className="font-medium app-text-primary">Fixed Date</p>
              <p className="mt-1">
                Uses the client deadline. At Risk starts{" "}
                {FIXED_DATE_RISK_THRESHOLD_DAYS} days before the deadline.
              </p>
            </div>

            <div className="rounded-xl border p-3 app-card">
              <p className="font-medium app-text-primary">ASAP</p>
              <p className="mt-1">
                Uses an internal target of {INTERNAL_ASAP_TARGET_DAYS} days from
                start date. At Risk starts {ASAP_RISK_THRESHOLD_DAYS} days
                before the internal target.
              </p>
            </div>

            <div className="rounded-xl border p-3 app-card">
              <p className="font-medium app-text-primary">Inactive Statuses</p>
              <p className="mt-1">
                Completed, On Hold and Closed positions do not calculate active
                risk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}