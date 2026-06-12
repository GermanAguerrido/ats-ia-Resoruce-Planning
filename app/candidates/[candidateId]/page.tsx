"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { candidates } from "../../data/candidates";
import { jobApplications } from "../../data/jobApplications";
import { jobs } from "../../data/jobs";
import type {
  JobApplicationStage,
  JobApplicationStatus,
} from "../../types/jobApplication";
import {
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

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateIdParam = params.candidateId;
  const candidateId = Array.isArray(candidateIdParam)
    ? candidateIdParam[0]
    : candidateIdParam;

  const candidate = candidates.find(
    (currentCandidate) => currentCandidate.id === candidateId
  );

  const applicationsForCandidate = jobApplications.filter(
    (application) => application.candidateId === candidateId
  );

  if (!candidate) {
    return (
      <div className="min-h-screen app-bg px-6 py-6">
        <div className="rounded-2xl border p-8 shadow-sm app-card">
          <p className="text-sm font-medium app-text-secondary">
            Candidate not found
          </p>

          <h1 className="mt-2 text-2xl font-bold app-text-primary">
            We could not find this candidate.
          </h1>

          <Link
            href="/candidates"
            className="mt-6 inline-flex rounded-xl px-4 py-2 text-sm font-medium app-button-primary"
          >
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  const activeApplicationsCount = applicationsForCandidate.filter(
    (application) => application.status === "active"
  ).length;

  const averageMatchScore =
    applicationsForCandidate.length > 0
      ? Math.round(
          applicationsForCandidate.reduce(
            (acc, application) => acc + application.matchScore,
            0
          ) / applicationsForCandidate.length
        )
      : candidate.match;

  return (
    <div className="min-h-screen app-bg px-6 py-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/candidates"
              className="text-sm font-medium app-text-secondary hover:underline"
            >
              ← Back to Candidates
            </Link>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border text-sm font-bold app-card app-text-primary">
                {candidate.initials}
              </div>

              <div>
                <h1 className="text-2xl font-bold app-text-primary">
                  {candidate.name}
                </h1>

                <p className="mt-1 text-sm app-text-secondary">
                  {candidate.designation || candidate.role} ·{" "}
                  {candidate.country}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700">
              {candidate.status}
            </span>

            <span
              className={`inline-flex rounded-full px-3 py-2 text-sm font-medium ${getMatchScoreClassName(
                candidate.match
              )}`}
            >
              {candidate.match}% Match
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Recruiter Seniority</p>
            <p className="mt-2 text-xl font-bold app-text-primary">
              {candidate.recruiterSeniority || candidate.seniority}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Technical Seniority</p>
            <p className="mt-2 text-xl font-bold app-text-primary">
              {candidate.technicalSeniority || "Pending"}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">English</p>
            <p className="mt-2 text-xl font-bold app-text-primary">
              {candidate.english}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Availability</p>
            <p className="mt-2 text-xl font-bold app-text-primary">
              {candidate.availability}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border p-5 shadow-sm app-card lg:col-span-2">
            <h2 className="text-base font-semibold app-text-primary">
              Candidate Overview
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  ID
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {candidate.id}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Role
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {candidate.designation || candidate.role}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Country
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {candidate.country}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Years Experience
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {candidate.yearsExperience || "Pending"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Recruiter
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {candidate.recruiter}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Expected Salary
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {candidate.expectedSalary
                    ? `${candidate.salaryCurrency || ""} ${
                        candidate.expectedSalary
                      }`
                    : candidate.salary}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Updated
                </p>
                <p className="mt-1 text-sm font-medium app-text-primary">
                  {candidate.updated}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                Recruiter Conclusion
              </p>
              <p className="mt-2 text-sm leading-6 app-text-secondary">
                {candidate.recruiterConclusion || candidate.note}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                Notes
              </p>
              <p className="mt-2 text-sm leading-6 app-text-secondary">
                {candidate.note}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm app-card">
            <h2 className="text-base font-semibold app-text-primary">
              Contact & Links
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Email
                </p>
                <p className="mt-1 text-sm app-text-secondary">
                  {candidate.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  LinkedIn
                </p>
                {candidate.linkedin ? (
                  <a
                    href={candidate.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-blue-600 hover:underline"
                  >
                    Open LinkedIn
                  </a>
                ) : (
                  <p className="mt-1 text-sm app-text-secondary">—</p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Portfolio
                </p>
                {candidate.portfolio ? (
                  <a
                    href={candidate.portfolio}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block text-sm text-blue-600 hover:underline"
                  >
                    Open Portfolio
                  </a>
                ) : (
                  <p className="mt-1 text-sm app-text-secondary">—</p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide app-text-muted">
                  Salary Notes
                </p>
                <p className="mt-1 text-sm leading-6 app-text-secondary">
                  {candidate.salaryNotes || "No salary notes added."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Assigned Positions</p>
            <p className="mt-2 text-2xl font-bold app-text-primary">
              {applicationsForCandidate.length}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">Active Processes</p>
            <p className="mt-2 text-2xl font-bold app-text-primary">
              {activeApplicationsCount}
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">
              Average Position Match
            </p>
            <p className="mt-2 text-2xl font-bold app-text-primary">
              {averageMatchScore}%
            </p>
          </div>

          <div className="rounded-2xl border p-4 shadow-sm app-card">
            <p className="text-sm app-text-secondary">General Match</p>
            <p className="mt-2 text-2xl font-bold app-text-primary">
              {candidate.match}%
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border p-5 shadow-sm app-card">
            <h2 className="text-base font-semibold app-text-primary">
              Strengths
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.strengths.map((strength) => (
                <span
                  key={strength}
                  className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"
                >
                  {strength}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm app-card">
            <h2 className="text-base font-semibold app-text-primary">
              Risks
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.risks.map((risk) => (
                <span
                  key={risk}
                  className="rounded-full bg-red-100 px-3 py-1 text-sm text-red-700"
                >
                  {risk}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border p-5 shadow-sm app-card">
            <h2 className="text-base font-semibold app-text-primary">Tags</h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-3 py-1 text-sm app-card app-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-5 shadow-sm app-card">
            <h2 className="text-base font-semibold app-text-primary">
              Timeline
            </h2>

            <div className="mt-4 space-y-3">
              {candidate.timeline.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border px-3 py-2 text-sm app-card app-text-secondary"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border shadow-sm app-card">
          <div className="border-b px-5 py-4 app-border">
            <h2 className="text-base font-semibold app-text-primary">
              Position Applications
            </h2>
            <p className="mt-1 text-sm app-text-secondary">
              Positions connected to this candidate with stage, match and status.
            </p>
          </div>

          {applicationsForCandidate.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y text-sm app-border">
                <thead className="app-table-header">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Position
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Stage</th>
                    <th className="px-4 py-3 text-left font-medium">Match</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Position Risk
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Last Activity
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y app-border">
                  {applicationsForCandidate.map((application) => {
                    const baseJob = jobs.find(
                      (currentJob) => currentJob.id === application.jobId
                    );

                    const job = baseJob ? getJobWithRisk(baseJob) : null;

                    return (
                      <tr
                        key={application.id}
                        className="transition app-table-row"
                      >
                        <td className="whitespace-nowrap px-4 py-4 font-medium app-text-primary">
                          {job ? (
                            <Link
                              href={`/jobs/${job.id}`}
                              className="hover:underline"
                            >
                              {job.position}
                            </Link>
                          ) : (
                            application.candidateRole
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 app-text-secondary">
                          {job ? job.client : "—"}
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

                        <td className="whitespace-nowrap px-4 py-4">
                          {job?.risk ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                riskClassName[job.risk]
                              }`}
                            >
                              {riskText[job.risk]}
                            </span>
                          ) : job ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                statusClassName[job.status]
                              }`}
                            >
                              {statusText[job.status]}
                            </span>
                          ) : (
                            <span className="text-xs app-text-muted">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          {job ? (
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                priorityClassName[job.priority]
                              }`}
                            >
                              {priorityText[job.priority]}
                            </span>
                          ) : (
                            <span className="text-xs app-text-muted">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 app-text-secondary">
                          {formatDate(application.lastActivityAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <p className="text-sm font-medium app-text-primary">
                No position applications found.
              </p>
              <p className="mt-1 text-sm app-text-secondary">
                This candidate is not assigned to any position yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}