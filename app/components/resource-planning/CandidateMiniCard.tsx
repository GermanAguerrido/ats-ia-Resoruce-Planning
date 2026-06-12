import type { MouseEvent } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  PauseCircle,
  UserCheck,
} from "lucide-react";
import type {
  CandidateMini,
  CandidateProcessStatus,
  CandidateResumeStatus,
  CandidateTalentType,
} from "@/app/data/resourcePlanningMock";

type Props = {
  candidate: CandidateMini;
  onClick?: () => void;
};

const processStatusConfig: Record<
  CandidateProcessStatus,
  { label: string; className: string }
> = {
  sourced: {
    label: "Sourced",
    className: "rp-candidate-contacted",
  },
  contacted: {
    label: "Contacted",
    className: "rp-candidate-contacted",
  },
  screening: {
    label: "Screening",
    className: "rp-candidate-approved",
  },
  presented: {
    label: "Presented",
    className: "rp-candidate-resume",
  },
  tech_interview: {
    label: "Tech Interview",
    className: "rp-candidate-tech-interview",
  },
  client_interview: {
    label: "Client Interview",
    className: "rp-candidate-interviewed",
  },
  offer: {
    label: "Offer",
    className: "rp-candidate-wip-resume",
  },
  hired: {
    label: "Hired",
    className: "rp-candidate-hired",
  },
  rejected: {
    label: "Rejected",
    className: "rp-position-cancelled",
  },
  stand_by: {
    label: "Stand by",
    className: "rp-position-on-hold",
  },
};

const resumeStatusConfig: Record<
  CandidateResumeStatus,
  { label: string; className: string }
> = {
  none: {
    label: "No Resume",
    className: "rp-status-badge",
  },
  wip_resume: {
    label: "WIP Resume",
    className: "rp-candidate-wip-resume",
  },
  resume_ready: {
    label: "Resume Ready",
    className: "rp-candidate-resume",
  },
};

const talentTypeConfig: Record<
  CandidateTalentType,
  { label: string; className: string }
> = {
  external: {
    label: "External",
    className: "rp-status-badge",
  },
  internal_candidate: {
    label: "Internal Candidate",
    className: "rp-priority-badge",
  },
  trick_internal: {
    label: "Trick Internal",
    className: "rp-candidate-trick-internal",
  },
};

type CandidateSignal = {
  id: string;
  label: string;
  icon: "alert" | "check" | "clock" | "file" | "pause" | "user";
  className: string;
};

function getCandidateSignals(candidate: CandidateMini): CandidateSignal[] {
  const signals: CandidateSignal[] = [];

  if (
    typeof candidate.daysInProcess === "number" &&
    candidate.daysInProcess >= 14 &&
    candidate.processStatus !== "hired" &&
    candidate.processStatus !== "rejected"
  ) {
    signals.push({
      id: "aging-alert",
      label: `${candidate.daysInProcess} days in process`,
      icon: "alert",
      className: "rp-auto-signal-warning",
    });
  }

  if (candidate.resumeStatus === "none") {
    signals.push({
      id: "resume-missing",
      label: "Resume missing",
      icon: "file",
      className: "rp-auto-signal-neutral",
    });
  }

  if (candidate.resumeStatus === "wip_resume") {
    signals.push({
      id: "resume-wip",
      label: "Resume WIP",
      icon: "clock",
      className: "rp-auto-signal-info",
    });
  }

  if (
    candidate.resumeStatus === "resume_ready" &&
    candidate.processStatus !== "hired"
  ) {
    signals.push({
      id: "ready-to-present",
      label: "Ready to present",
      icon: "check",
      className: "rp-auto-signal-info",
    });
  }

  if (candidate.processStatus === "stand_by") {
    signals.push({
      id: "stand-by",
      label: "Paused / Stand by",
      icon: "pause",
      className: "rp-auto-signal-warning",
    });
  }

  if (
    candidate.processStatus === "hired" ||
    candidate.talentType === "trick_internal"
  ) {
    signals.push({
      id: "trick-internal",
      label: "Moved to Trick Internal",
      icon: "user",
      className: "rp-auto-signal-success",
    });
  }

  return signals.slice(0, 3);
}

function SignalIcon({ icon }: { icon: CandidateSignal["icon"] }) {
  if (icon === "alert") {
    return <AlertTriangle className="h-3 w-3" />;
  }

  if (icon === "check") {
    return <CheckCircle2 className="h-3 w-3" />;
  }

  if (icon === "clock") {
    return <Clock3 className="h-3 w-3" />;
  }

  if (icon === "file") {
    return <FileText className="h-3 w-3" />;
  }

  if (icon === "pause") {
    return <PauseCircle className="h-3 w-3" />;
  }

  return <UserCheck className="h-3 w-3" />;
}

export function CandidateMiniCard({ candidate, onClick }: Props) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (onClick) {
      onClick();
    }
  };

  const processStatus = processStatusConfig[candidate.processStatus];
  const resumeStatus = resumeStatusConfig[candidate.resumeStatus];
  const talentType = talentTypeConfig[candidate.talentType];
  const signals = getCandidateSignals(candidate);

  return (
    <div
      onClick={handleClick}
      className={`rounded-xl border p-3 transition app-border bg-black/[0.025] hover:bg-black/[0.04] dark:bg-white/[0.035] dark:hover:bg-white/[0.06] ${
        onClick ? "cursor-pointer hover:border-violet-500/40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium app-text-primary">
            {candidate.name}
          </p>

          <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
            {candidate.role} · {candidate.location}
          </p>
        </div>

        <div className="rp-avatar-badge flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
          {candidate.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Process
          </p>

          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rp-candidate-badge rounded-md px-2 py-1 text-[10px] font-semibold ${processStatus.className}`}
            >
              {processStatus.label}
            </span>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Resume / Type
          </p>

          <div className="flex flex-wrap gap-1.5">
            <span
              className={`rp-candidate-badge rounded-md px-2 py-1 text-[10px] font-semibold ${resumeStatus.className}`}
            >
              {resumeStatus.label}
            </span>

            <span
              className={`rp-candidate-badge rounded-md px-2 py-1 text-[10px] font-semibold ${talentType.className}`}
            >
              {talentType.label}
            </span>
          </div>
        </div>

        {signals.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Auto signals
            </p>

            <div className="flex flex-wrap gap-1.5">
              {signals.map((signal) => (
                <span
                  key={signal.id}
                  className={`rp-auto-signal inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${signal.className}`}
                >
                  <SignalIcon icon={signal.icon} />
                  {signal.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}