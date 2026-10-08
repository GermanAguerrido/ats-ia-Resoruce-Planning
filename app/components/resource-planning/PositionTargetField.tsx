"use client";

import type { PositionTarget } from "@/app/data/resourcePlanningMock";
import {
  MONTH_NAMES,
  TARGET_TYPE_LABELS,
  WEEK_LABELS,
  defaultTargetFor,
  type PositionTargetType,
} from "@/app/lib/positionTarget";

const selectClass = "rp-select";

/** Selector de fecha objetivo flexible: ASAP, fecha, semana de un mes, mes o trimestre. */
export function PositionTargetField({
  value,
  onChange,
}: {
  value?: PositionTarget;
  onChange: (next: PositionTarget) => void;
}) {
  const target: PositionTarget = value ?? { type: "asap" };
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1];

  const yearSelect = (year: number, update: (year: number) => PositionTarget) => (
    <select
      className={selectClass}
      value={year}
      onChange={(event) => onChange(update(Number(event.target.value)))}
    >
      {Array.from(new Set([...years, year])).map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        className={selectClass}
        value={target.type}
        onChange={(event) =>
          onChange(defaultTargetFor(event.target.value as PositionTargetType))
        }
      >
        {(Object.keys(TARGET_TYPE_LABELS) as PositionTargetType[]).map((type) => (
          <option key={type} value={type}>
            {TARGET_TYPE_LABELS[type]}
          </option>
        ))}
      </select>

      {target.type === "date" && (
        <input
          type="date"
          className={selectClass}
          value={target.date}
          onChange={(event) =>
            event.target.value && onChange({ type: "date", date: event.target.value })
          }
        />
      )}

      {target.type === "week" && (
        <>
          <select
            className={selectClass}
            value={target.week}
            onChange={(event) =>
              onChange({ ...target, week: Number(event.target.value) as 1 | 2 | 3 | 4 })
            }
          >
            {WEEK_LABELS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={target.month}
            onChange={(event) => onChange({ ...target, month: Number(event.target.value) })}
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>

          {yearSelect(target.year, (year) => ({ ...target, year }))}
        </>
      )}

      {target.type === "month" && (
        <>
          <select
            className={selectClass}
            value={target.month}
            onChange={(event) => onChange({ ...target, month: Number(event.target.value) })}
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>

          {yearSelect(target.year, (year) => ({ ...target, year }))}
        </>
      )}

      {target.type === "quarter" && (
        <>
          <select
            className={selectClass}
            value={target.quarter}
            onChange={(event) =>
              onChange({ ...target, quarter: Number(event.target.value) as 1 | 2 | 3 | 4 })
            }
          >
            {[1, 2, 3, 4].map((quarter) => (
              <option key={quarter} value={quarter}>
                Q{quarter}
              </option>
            ))}
          </select>

          {yearSelect(target.year, (year) => ({ ...target, year }))}
        </>
      )}
    </div>
  );
}