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

/** ¿Ya pasó la fecha objetivo? (ASAP nunca vence; semana, mes y trimestre vencen al terminar). */
export function isTargetOverdue(target?: PositionTarget, now = new Date()): boolean {
  if (!target || target.type === "asap") {
    return false;
  }

  let end: Date;

  if (target.type === "date") {
    end = new Date(`${target.date}T23:59:59`);
  } else if (target.type === "week") {
    // Semanas aproximadas: 1 = días 1-7, 2 = 8-14, 3 = 15-21, 4 = 22 hasta fin de mes
    const lastDay =
      target.week === 4
        ? new Date(target.year, target.month + 1, 0).getDate()
        : target.week * 7;

    end = new Date(target.year, target.month, lastDay, 23, 59, 59);
  } else if (target.type === "month") {
    end = new Date(target.year, target.month + 1, 0, 23, 59, 59);
  } else {
    end = new Date(target.year, target.quarter * 3, 0, 23, 59, 59);
  }

  return Number.isNaN(end.getTime()) ? false : end.getTime() < now.getTime();
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
