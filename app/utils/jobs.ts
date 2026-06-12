import type {
  Job,
  JobDeadlineType,
  JobPriority,
  JobStatus,
} from "../types/job";

export type RiskStatus = "on_track" | "at_risk" | "overdue";

export const INTERNAL_ASAP_TARGET_DAYS = 18;
export const FIXED_DATE_RISK_THRESHOLD_DAYS = 7;
export const ASAP_RISK_THRESHOLD_DAYS = 5;

export const statusClassName: Record<JobStatus, string> = {
  open: "bg-green-100 text-green-700",
  completed: "bg-violet-100 text-violet-700",
  on_hold: "bg-gray-100 text-gray-700",
  closed: "bg-gray-900 text-white",
};

export const statusText: Record<JobStatus, string> = {
  open: "Open",
  completed: "Completed",
  on_hold: "On Hold",
  closed: "Closed",
};

export const priorityClassName: Record<JobPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-gray-100 text-gray-700",
};

export const priorityText: Record<JobPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const deadlineTypeText: Record<JobDeadlineType, string> = {
  fixed_date: "Fixed Date",
  asap: "ASAP",
};

export const deadlineTypeClassName: Record<JobDeadlineType, string> = {
  fixed_date: "bg-blue-100 text-blue-700",
  asap: "bg-amber-100 text-amber-700",
};

export const riskText: Record<RiskStatus, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  overdue: "Overdue",
};

export const riskClassName: Record<RiskStatus, string> = {
  on_track: "bg-green-100 text-green-700",
  at_risk: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-700",
};

export function parseDateAsLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function getTodayAsLocalDate() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export function addDays(date: Date, days: number) {
  const newDate = new Date(date);

  newDate.setDate(newDate.getDate() + days);

  return newDate;
}

export function differenceInDays(fromDate: Date, toDate: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const from = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  );

  const to = new Date(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate()
  );

  return Math.round((to.getTime() - from.getTime()) / millisecondsPerDay);
}

export function formatDate(date: string | Date) {
  const dateToFormat =
    typeof date === "string" ? parseDateAsLocalDate(date) : date;

  return dateToFormat.toLocaleDateString("es-AR");
}

export function getTargetDate(job: Job) {
  if (job.deadlineType === "fixed_date" && job.deadlineDate) {
    return parseDateAsLocalDate(job.deadlineDate);
  }

  const startDate = parseDateAsLocalDate(job.startDate);

  return addDays(startDate, INTERNAL_ASAP_TARGET_DAYS);
}

export function getTargetDateLabel(job: Job) {
  if (job.deadlineType === "fixed_date") {
    return "Client deadline";
  }

  return "Internal target";
}

export function getRiskStatus(job: Job): RiskStatus | null {
  if (job.status !== "open") {
    return null;
  }

  const today = getTodayAsLocalDate();
  const targetDate = getTargetDate(job);
  const daysUntilTarget = differenceInDays(today, targetDate);

  if (daysUntilTarget < 0) {
    return "overdue";
  }

  const threshold =
    job.deadlineType === "asap"
      ? ASAP_RISK_THRESHOLD_DAYS
      : FIXED_DATE_RISK_THRESHOLD_DAYS;

  if (daysUntilTarget <= threshold) {
    return "at_risk";
  }

  return "on_track";
}

export function getDaysUntilTarget(job: Job) {
  const today = getTodayAsLocalDate();
  const targetDate = getTargetDate(job);

  return differenceInDays(today, targetDate);
}

export function getJobWithRisk(job: Job) {
  return {
    ...job,
    risk: getRiskStatus(job),
    targetDate: getTargetDate(job),
    targetDateLabel: getTargetDateLabel(job),
    daysUntilTarget: getDaysUntilTarget(job),
  };
}

export type JobWithRisk = ReturnType<typeof getJobWithRisk>;