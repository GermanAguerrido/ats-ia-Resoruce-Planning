import { useState, type MouseEvent } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  CheckCircle2,
  Clock3,
  FileText,
  Phone,
  PauseCircle,
  UserCheck,
  Building2,
} from "lucide-react";
import type {
  CandidateMini,
  CandidateProcessStatus,
  CandidateResumeStatus,
} from "@/app/data/resourcePlanningMock";
import type { CandidateAlert } from "@/app/lib/candidateAlerts";
import { getInterviewTypeLabel } from "./QuickActionDialogs";
import {
  AGING_DAYS,
  CONTACT_ALERT_DAYS,
  PROCESS_FLOW,
  PROCESS_OUTCOMES,
  getDaysInProcess,
  getDaysSinceContact,
  getPresentationReadiness,
  isHiredCandidate,
  isInProcessCandidate,
} from "@/app/lib/candidateStatus";

type Props = {
  candidate: CandidateMini;
  onClick?: () => void;
  // Acciones rápidas al pasar el mouse (si faltan, no se muestran)
  onQuickStage?: (to: CandidateProcessStatus) => void;
  onQuickContact?: () => void;
  onQuickSchedule?: () => void;
  // Con "My alerts" activo se muestran estas alertas en lugar de las señales habituales
  alerts?: CandidateAlert[];
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
    label: "Interviewed",
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
    label: "Client Tech Interview",
    className: "rp-candidate-interviewed",
  },
  to_offer: {
    label: "To offer",
    className: "rp-candidate-wip-resume",
  },
  offer: {
    label: "Offered",
    className: "rp-candidate-wip-resume",
  },
  offer_rejected: {
    label: "Offer rejected",
    className: "rp-position-cancelled",
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
    label: "No resume",
    className: "rp-status-badge",
  },
  wip_resume: {
    label: "WIP resume",
    className: "rp-candidate-wip-resume",
  },
  resume_ready: {
    label: "Resume ready",
    className: "rp-candidate-resume",
  },
};

type CandidateSignal = {
  id: string;
  label: string;
  icon: "alert" | "check" | "clock" | "file" | "pause" | "user" | "calendar";
  className: string;
};

function getCandidateSignals(candidate: CandidateMini): CandidateSignal[] {
  const signals: CandidateSignal[] = [];
  const active = isInProcessCandidate(candidate);
  const daysInProcess = getDaysInProcess(candidate);
  const daysSinceContact = getDaysSinceContact(candidate);
  const readiness = getPresentationReadiness(candidate);

  if (active && candidate.scheduledInterview) {
    const { type, at } = candidate.scheduledInterview;
    const passed = new Date(at).getTime() < Date.now();

    signals.push({
      id: "scheduled",
      label: `${getInterviewTypeLabel(type)} · ${at.replace("T", " ")}`,
      icon: "calendar",
      className: passed ? "rp-auto-signal-warning" : "rp-auto-signal-info",
    });
  }

  if (active && daysInProcess !== null && daysInProcess >= AGING_DAYS) {
    signals.push({
      id: "aging-alert",
      label: `${daysInProcess} days in process`,
      icon: "alert",
      className: "rp-auto-signal-warning",
    });
  }

  if (
    active &&
    daysSinceContact !== null &&
    daysSinceContact >= CONTACT_ALERT_DAYS
  ) {
    signals.push({
      id: "no-contact",
      label: `No contact ${daysSinceContact}d`,
      icon: "clock",
      className: "rp-auto-signal-warning",
    });
  }

  if (readiness.applicable && readiness.ready) {
    signals.push({
      id: "ready-to-present",
      label: "Ready to present",
      icon: "check",
      className: "rp-auto-signal-success",
    });
  }

  if (active && candidate.resumeStatus === "none") {
    signals.push({
      id: "resume-missing",
      label: "Resume missing",
      icon: "file",
      className: "rp-auto-signal-neutral",
    });
  }

  if (active && candidate.resumeStatus === "wip_resume") {
    signals.push({
      id: "resume-wip",
      label: "Resume WIP",
      icon: "clock",
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

  if (isHiredCandidate(candidate)) {
    signals.push({
      id: "hired-internal",
      label: "Hired · Internal",
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

  if (icon === "calendar") {
    return <CalendarClock className="h-3 w-3" />;
  }

  if (icon === "pause") {
    return <PauseCircle className="h-3 w-3" />;
  }

  return <UserCheck className="h-3 w-3" />;
}

function getRecruiterInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function QuickBar({
  candidate,
  onQuickStage,
  onQuickContact,
  onQuickSchedule,
  onMenuChange,
}: {
  candidate: CandidateMini;
  onQuickStage?: (to: CandidateProcessStatus) => void;
  onQuickContact?: () => void;
  onQuickSchedule?: () => void;
  onMenuChange: (open: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const setMenu = (open: boolean) => {
    setMenuOpen(open);
    onMenuChange(open);
  };

  const buttonClass =
    "rounded-lg px-2 py-1 text-[11px] font-semibold app-text-secondary transition hover:bg-violet-500/15 hover:text-violet-600 dark:hover:text-violet-300";

  const stop = (event: MouseEvent) => event.stopPropagation();

  return (
    <div
      onClick={stop}
      className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-xl border border-violet-500/60 p-0.5 shadow-lg app-card"
    >
      {onQuickStage && (
        <div className="relative">
          <button type="button" onClick={() => setMenu(!menuOpen)} className={buttonClass}>
            ⇄ Status <ChevronDown className="inline h-3 w-3" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />

              <div className="absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-xl border py-1 text-xs shadow-xl app-border app-card">
                {[...PROCESS_FLOW, ...PROCESS_OUTCOMES]
                  .filter((item) => item.value !== candidate.processStatus)
                  .map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setMenu(false);
                        onQuickStage(item.value);
                      }}
                      className="block w-full px-3 py-1.5 text-left app-text-primary hover:bg-violet-500/10"
                    >
                      {item.label}
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      )}

      {onQuickContact && (
        <button type="button" onClick={onQuickContact} className={buttonClass}>
          <Phone className="mr-1 inline h-3 w-3" />
          Contact
        </button>
      )}

      {onQuickSchedule && (
        <button type="button" onClick={onQuickSchedule} className={buttonClass}>
          <CalendarClock className="mr-1 inline h-3 w-3" />
          Schedule
        </button>
      )}
    </div>
  );
}

export function CandidateMiniCard({
  candidate,
  onClick,
  onQuickStage,
  onQuickContact,
  onQuickSchedule,
  alerts,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasQuickActions = Boolean(onQuickStage || onQuickContact || onQuickSchedule);
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (onClick) {
      onClick();
    }
  };

  const processStatus = processStatusConfig[candidate.processStatus];
  const resumeStatus = resumeStatusConfig[candidate.resumeStatus];
  const signals = getCandidateSignals(candidate);

  const isInternal =
    candidate.talentType !== "external" ||
    candidate.processStatus === "hired";

  return (
    <div
      onClick={handleClick}
      className={`group/cand relative rounded-xl border p-3 transition app-border bg-white/20 hover:bg-white/30 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] ${
        onClick ? "cursor-pointer hover:border-violet-500/40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold app-text-primary">
            {candidate.name} <span className="font-bold">· {candidate.role}</span>
          </p>

          {/* País: mismo color que el nombre, sin bold */}
          <p className="mt-0.5 truncate text-xs app-text-primary">
            {candidate.location}
          </p>
        </div>

        <div className={hasQuickActions ? "group-hover/cand:invisible" : ""}>
          {isInternal ? (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/30 border border-violet-500/50">
              <Building2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-300" />
            </div>
          ) : (
            <div className="rp-avatar-badge flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
              {getRecruiterInitials(candidate.recruiterOwner || "")}
            </div>
          )}
        </div>
      </div>

      {hasQuickActions && (
        <div className={menuOpen ? "block" : "hidden group-hover/cand:block"}>
          <QuickBar
            candidate={candidate}
            onQuickStage={onQuickStage}
            onQuickContact={onQuickContact}
            onQuickSchedule={onQuickSchedule}
            onMenuChange={setMenuOpen}
          />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={`rp-candidate-badge rounded-md px-2 py-1 text-[10px] font-semibold ${processStatus.className}`}
        >
          {processStatus.label}
        </span>

        <span
          className={`rp-candidate-badge rounded-md px-2 py-1 text-[10px] font-semibold ${resumeStatus.className}`}
        >
          {resumeStatus.label}
        </span>
      </div>

      {alerts && alerts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {alerts.map((alert) => (
            <span
              key={alert.id}
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${
                alert.tone === "danger"
                  ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-300"
                  : "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              {alert.label}
            </span>
          ))}
        </div>
      )}

      {!alerts && signals.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
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
      )}
    </div>
  );
}
