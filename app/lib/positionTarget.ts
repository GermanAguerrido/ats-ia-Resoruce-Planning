import type { PositionTarget } from "@/app/data/resourcePlanningMock";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const WEEK_LABELS = ["First week", "Second week", "Third week", "Last week"];

export type PositionTargetType = PositionTarget["type"];

export const TARGET_TYPE_LABELS: Record<PositionTargetType, string> = {
  asap: "ASAP",
  date: "Specific date",
  week: "Week of a month",
  month: "Month",
  quarter: "Quarter",
};

/** Texto legible de la fecha objetivo (flexible: ASAP, fecha, semana de un mes, mes o trimestre). */
export function formatPositionTarget(target?: PositionTarget): string {
  if (!target || target.type === "asap") {
    return "ASAP";
  }

  if (target.type === "date") {
    return target.date;
  }

  if (target.type === "week") {
    return `${WEEK_LABELS[target.week - 1] ?? "Week"} of ${MONTH_NAMES[target.month]} ${target.year}`;
  }

  if (target.type === "month") {
    return `${MONTH_NAMES[target.month]} ${target.year}`;
  }

  return `Q${target.quarter} ${target.year}`;
}

/** Valor inicial al elegir un tipo de fecha objetivo. */
export function defaultTargetFor(type: PositionTargetType): PositionTarget {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (type === "date") {
    return { type: "date", date: now.toISOString().slice(0, 10) };
  }

  if (type === "week") {
    return { type: "week", week: 1, month, year };
  }

  if (type === "month") {
    return { type: "month", month, year };
  }

  if (type === "quarter") {
    return { type: "quarter", quarter: (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4, year };
  }

  return { type: "asap" };
}