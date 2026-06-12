"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  LinkIcon,
  Mail,
  MessageSquare,
  Paperclip,
  Star,
  UserRoundCheck,
  X,
} from "lucide-react";

import type { Candidate } from "@/app/types/candidate";

import { CandidateStatusChip } from "./candidate-status-chip";

type PanelTab = "Overview" | "Timeline" | "Feedback" | "Files";

type Props = {
  candidate: Candidate;
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  onClose: () => void;
  onMoveStage: (candidateName: string, status: string) => void;
  onDiscardCandidate: (candidateName: string) => void;
};

const candidateStatuses = [
  "Applied",
  "HR Interview",
  "Technical Interview",
  "Client Interview",
  "Offered",
  "Hired",
  "Discarded",
];

function EmptyValue({ children = "Not provided" }: { children?: string }) {
  return <span className="app-text-muted">{children}</span>;
}

function formatSalary(value?: string, currency?: string) {
  if (!value) {
    return "";
  }

  const cleanValue = value.trim();
  const cleanCurrency = currency?.trim();

  if (!cleanCurrency) {
    return cleanValue;
  }

  const alreadyHasCurrency = cleanValue
    .toLowerCase()
    .startsWith(cleanCurrency.toLowerCase());

  if (alreadyHasCurrency) {
    return cleanValue;
  }

  return `${cleanCurrency} ${cleanValue}`;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0 app-border">
      <span className="text-xs uppercase tracking-wide app-text-muted">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-sm app-text-primary">
        {value ? value : <EmptyValue />}
      </span>
    </div>
  );
}

function LinkRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0 app-border">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide app-text-muted">
        {icon}
        {label}
      </div>

      {value ? (
        <a
          href={value.startsWith("http") ? value : `mailto:${value}`}
          target={value.startsWith("http") ? "_blank" : undefined}
          rel={value.startsWith("http") ? "noreferrer" : undefined}
          className="flex max-w-[65%] items-center gap-1 truncate text-right text-sm app-text-primary hover:underline"
        >
          <span className="truncate">{value}</span>
          {value.startsWith("http") && <ExternalLink className="h-3.5 w-3.5" />}
        </a>
      ) : (
        <span className="text-sm app-text-muted">Not provided</span>
      )}
    </div>
  );
}

export function CandidateSidePanel({
  candidate,
  activeTab,
  onTabChange,
  onClose,
  onMoveStage,
  onDiscardCandidate,
}: Props) {
  const [moveStageOpen, setMoveStageOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [targetStage, setTargetStage] = useState(candidate.status);

  const technicalSeniority =
    candidate.technicalSeniority || "Pending technical validation";

  const currentSalary = formatSalary(
    candidate.currentSalary,
    candidate.salaryCurrency
  );

  const expectedSalary = formatSalary(
    candidate.expectedSalary,
    candidate.salaryCurrency
  );

  function confirmMoveStage() {
    onMoveStage(candidate.name, targetStage);
    setMoveStageOpen(false);
  }

  function confirmDiscard() {
    onDiscardCandidate(candidate.name);
    setDiscardConfirmOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <aside className="relative flex h-full w-full max-w-2xl flex-col border-l shadow-2xl app-card">
        <div className="border-b p-6 app-border">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border text-sm font-semibold app-card app-text-primary">
                {candidate.initials}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold app-text-primary">
                    {candidate.name}
                  </h3>

                  <CandidateStatusChip status={candidate.status} />
                </div>

                <p className="mt-1 text-sm app-text-secondary">
                  {candidate.designation || candidate.role}
                </p>

                <p className="mt-1 text-xs app-text-muted">
                  {candidate.country} •{" "}
                  {candidate.yearsExperience || "Exp. pending"} •{" "}
                  {candidate.english} English
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 app-text-secondary hover:underline"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {(["Overview", "Timeline", "Feedback", "Files"] as PanelTab[]).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                    activeTab === tab
                      ? "app-button-primary"
                      : "app-card app-text-secondary"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "Overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border p-4 app-card">
                  <p className="flex items-center gap-2 text-xs app-text-muted">
                    <UserRoundCheck className="h-3.5 w-3.5" />
                    Recruiter Seniority
                  </p>

                  <p className="mt-3 text-sm font-medium app-text-primary">
                    {candidate.recruiterSeniority || candidate.seniority}
                  </p>
                </div>

                <div className="rounded-xl border p-4 app-card">
                  <p className="flex items-center gap-2 text-xs app-text-muted">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Technical Seniority
                  </p>

                  <p
                    className={`mt-3 text-sm font-medium ${
                      candidate.technicalSeniority
                        ? "app-text-primary"
                        : "app-text-muted"
                    }`}
                  >
                    {technicalSeniority}
                  </p>
                </div>

                <div className="rounded-xl border p-4 app-card">
                  <p className="flex items-center gap-2 text-xs app-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    Availability
                  </p>

                  <p className="mt-3 text-sm font-medium app-text-primary">
                    {candidate.availability}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-4 app-card">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide app-text-muted">
                  <Mail className="h-3.5 w-3.5" />
                  Contact
                </p>

                <div className="mt-3">
                  <LinkRow
                    label="Email"
                    value={candidate.email}
                    icon={<Mail className="h-3.5 w-3.5" />}
                  />

                  <LinkRow
                    label="LinkedIn"
                    value={candidate.linkedin}
                    icon={<LinkIcon className="h-3.5 w-3.5" />}
                  />

                  <LinkRow
                    label="Portfolio"
                    value={candidate.portfolio}
                    icon={<ExternalLink className="h-3.5 w-3.5" />}
                  />
                </div>
              </div>

              <div className="rounded-xl border p-4 app-card">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide app-text-muted">
                  <DollarSign className="h-3.5 w-3.5" />
                  Compensation
                </p>

                <div className="mt-3">
                  <InfoRow label="Mode" value={candidate.salaryMode} />
                  <InfoRow label="Currency" value={candidate.salaryCurrency} />
                  <InfoRow label="Current salary" value={currentSalary} />
                  <InfoRow label="Expected salary" value={expectedSalary} />
                  <InfoRow label="Summary" value={candidate.salary} />
                </div>

                {candidate.salaryNotes && (
                  <div className="mt-4 rounded-xl border p-3 app-card">
                    <p className="text-xs uppercase tracking-wide app-text-muted">
                      Salary notes
                    </p>

                    <p className="mt-2 text-sm leading-6 app-text-secondary">
                      {candidate.salaryNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border p-4 app-card">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-wide app-text-muted">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Strengths
                  </p>

                  <ul className="mt-3 space-y-2 text-sm app-text-secondary">
                    {candidate.strengths.map((item) => (
                      <li key={item}>+ {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border p-4 app-card">
                  <p className="text-xs uppercase tracking-wide app-text-muted">
                    Risks
                  </p>

                  <ul className="mt-3 space-y-2 text-sm app-text-secondary">
                    {candidate.risks.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border p-4 app-card">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide app-text-muted">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Recruiter conclusion
                </p>

                <p className="mt-3 text-sm leading-6 app-text-secondary">
                  {candidate.recruiterConclusion || candidate.note}
                </p>
              </div>
            </div>
          )}

          {activeTab === "Timeline" && (
            <div className="rounded-xl border p-4 app-card">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide app-text-muted">
                <FileText className="h-3.5 w-3.5" />
                Activity timeline
              </p>

              <div className="mt-5 space-y-4">
                {candidate.timeline.map((item, index) => (
                  <div key={item} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-current app-text-muted" />

                      {index < candidate.timeline.length - 1 && (
                        <div className="mt-1 h-8 w-px app-bg" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm app-text-secondary">{item}</p>

                      <p className="mt-1 text-xs app-text-muted">
                        Updated {candidate.updated}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "Feedback" && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 app-card">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide app-text-muted">
                  <UserRoundCheck className="h-3.5 w-3.5" />
                  Recruiter assessment
                </p>

                <p className="mt-3 text-sm leading-6 app-text-secondary">
                  {candidate.recruiterConclusion || candidate.note}
                </p>
              </div>

              <div className="rounded-xl border p-4 app-card">
                <p className="flex items-center gap-2 text-xs uppercase tracking-wide app-text-muted">
                  <Star className="h-3.5 w-3.5" />
                  Technical feedback
                </p>

                {candidate.technicalSeniority ? (
                  <p className="mt-3 text-sm leading-6 app-text-secondary">
                    Technical seniority validated as{" "}
                    <span className="font-medium app-text-primary">
                      {candidate.technicalSeniority}
                    </span>
                    . Add interviewer notes here in a future iteration.
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-6 app-text-muted">
                    Technical feedback pending. This should be completed after
                    technical interview.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "Files" && (
            <div className="space-y-3">
              {["CV.pdf", "Recruiter notes.txt"].map((file) => (
                <div
                  key={file}
                  className="flex items-center justify-between rounded-xl border p-4 app-card"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 app-text-muted" />

                    <div>
                      <p className="text-sm font-medium app-text-primary">
                        {file}
                      </p>

                      <p className="text-xs app-text-muted">
                        Attached to candidate profile
                      </p>
                    </div>
                  </div>

                  <button className="rounded-lg border px-3 py-1.5 text-xs app-card app-text-secondary hover:underline">
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t p-6 app-border">
          <button className="rounded-xl px-4 py-2 text-sm font-medium app-button-primary">
            View full profile
          </button>

          <button
            onClick={() => {
              setTargetStage(candidate.status);
              setMoveStageOpen(true);
            }}
            className="rounded-xl border px-4 py-2 text-sm app-card app-text-secondary hover:underline"
          >
            Move stage
          </button>

          <button
            onClick={() => setDiscardConfirmOpen(true)}
            disabled={candidate.status === "Discarded"}
            className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Discard
          </button>
        </div>

        {moveStageOpen && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl app-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold app-text-primary">
                    Move candidate
                  </h3>

                  <p className="mt-1 text-sm app-text-secondary">
                    Move {candidate.name} to a new pipeline stage.
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

        {discardConfirmOpen && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-red-500/20 p-6 shadow-2xl app-card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold app-text-primary">
                    Discard candidate
                  </h3>

                  <p className="mt-1 text-sm leading-6 app-text-secondary">
                    This will move{" "}
                    <span className="font-medium app-text-primary">
                      {candidate.name}
                    </span>{" "}
                    to the Discarded stage.
                  </p>
                </div>

                <button
                  onClick={() => setDiscardConfirmOpen(false)}
                  className="rounded-lg p-2 app-text-secondary hover:underline"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm leading-6 text-red-500">
                  Confirm only if this candidate should no longer continue in
                  the current recruiting process.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setDiscardConfirmOpen(false)}
                  className="rounded-xl border px-4 py-2 text-sm app-card app-text-secondary"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDiscard}
                  className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400"
                >
                  Discard candidate
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

export type { PanelTab };