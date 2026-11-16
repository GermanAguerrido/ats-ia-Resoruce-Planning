"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_SLA,
  SLA_STAGES,
  resetStageSla,
  saveStageSla,
  type SlaConfig,
} from "@/app/lib/stageSla";
import { Card, Legend } from "./DashboardUi";

/** Número que se guarda al salir del campo o con Enter (así se puede borrar y escribir de nuevo). */
function NumberCell({
  value,
  min,
  onCommit,
}: {
  value: number;
  min: number;
  onCommit: (value: string) => void;
}) {
  return (
    <input
      key={value}
      type="number"
      min={min}
      defaultValue={value}
      onBlur={(event) => onCommit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      className="app-input w-20 rounded-lg border px-2 py-1 text-sm outline-none"
    />
  );
}

/** C4 · Tiempos esperados por etapa. Solo Talent y Admin los editan. */
export function SlaSection({ config, readOnly = false }: { config: SlaConfig; readOnly?: boolean }) {
  const [draft, setDraft] = useState<SlaConfig>(config);

  useEffect(() => setDraft(config), [config]);

  const update = (key: keyof SlaConfig, field: "min" | "max", value: string) => {
    const number = Math.max(0, Math.round(Number(value) || 0));
    const current = draft[key];
    const next = { ...current, [field]: number };

    // El mínimo nunca supera al máximo, y el máximo es al menos 1 día
    if (field === "min" && number > next.max) next.max = number;
    if (field === "max") next.max = Math.max(1, number);
    if (next.min > next.max) next.min = next.max;

    const nextConfig = { ...draft, [key]: next };

    setDraft(nextConfig);
    saveStageSla(nextConfig);
  };

  const totalMin = SLA_STAGES.reduce((total, stage) => total + draft[stage.key].min, 0);
  const totalMax = SLA_STAGES.reduce((total, stage) => total + draft[stage.key].max, 0);
  
  return (
    <fieldset disabled={readOnly} className="space-y-4">
      {readOnly && (
        <p className="rounded-xl border px-4 py-2 text-sm app-border app-text-muted">
          View only: your role can see these times but not change them.
        </p>
      )}

      <Card
        title="Stage times (SLA)"
        action={
          <button
            type="button"
            onClick={resetStageSla}
            className="rounded-lg border px-2.5 py-1 text-xs font-semibold app-border app-text-secondary hover:border-violet-500"
            disabled={JSON.stringify(draft) === JSON.stringify(DEFAULT_SLA)}
          >
            Restore document values
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t text-left text-[11px] uppercase tracking-wide app-border app-text-muted">
                <th className="px-5 py-2 font-semibold">Stage (app)</th>
                <th className="px-5 py-2 font-semibold">Process step</th>
                <th className="px-5 py-2 font-semibold">Responsible</th>
                <th className="px-5 py-2 font-semibold">Min days</th>
                <th className="px-5 py-2 font-semibold">Max days</th>
                <th className="px-5 py-2 font-semibold">Waits on</th>
              </tr>
            </thead>

            <tbody>
              {SLA_STAGES.map((stage) => (
                <tr key={stage.key} className="border-t app-border">
                  <td className="px-5 py-2.5 font-semibold app-text-primary">{stage.label}</td>
                  <td className="px-5 py-2.5 app-text-muted">{stage.step}</td>
                  <td className="px-5 py-2.5 app-text-secondary">{stage.responsible}</td>
                  <td className="px-5 py-2.5">
                    <NumberCell value={draft[stage.key].min} min={0} onCommit={(value) => update(stage.key, "min", value)} />
                  </td>
                  <td className="px-5 py-2.5">
                    <NumberCell value={draft[stage.key].max} min={1} onCommit={(value) => update(stage.key, "max", value)} />
                  </td>
                  <td className="px-5 py-2.5">
                    <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold app-border app-text-muted">
                      {stage.waitsOn}
                    </span>
                  </td>
                </tr>
              ))}

              <tr className="border-t app-border">
                <td className="px-5 py-2.5 font-semibold app-text-primary">Requisition</td>
                <td className="px-5 py-2.5 app-text-muted">
                  Position opened → first candidate (measured on the position)
                </td>
                <td className="px-5 py-2.5 app-text-secondary">Talent</td>
                <td className="px-5 py-2.5">
                  <NumberCell value={draft.requisition.min} min={0} onCommit={(value) => update("requisition", "min", value)} />
                </td>
                <td className="px-5 py-2.5">
                  <NumberCell value={draft.requisition.max} min={1} onCommit={(value) => update("requisition", "max", value)} />
                </td>
                <td className="px-5 py-2.5 app-text-muted">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-6 border-t px-5 py-3 text-sm app-border app-text-secondary">
          <span>
            <b className="app-text-primary">Total</b> {totalMin}–{totalMax} days
            <span className="app-text-muted"> (stages, without requisition)</span>
          </span>
          <span>
            {(totalMin / 5).toFixed(1)}–{(totalMax / 5).toFixed(1)} weeks
          </span>
          <span>
            {(totalMin / 20).toFixed(2)}–{(totalMax / 20).toFixed(1)} months
          </span>
        </div>
      </Card>

      <Legend
        items={[
          <>
            <b>Alerts</b>: a candidate who exceeds the maximum of its stage shows an amber alert;
            more than double, red. This replaces the old fixed 7 / 14 days.
          </>,
          <>
            <b>Pipeline and metrics</b>: the colors compare the average time with these values.
          </>,
          <>
            <b>Hired → Start</b>: min / max is the notice period between hiring and start date.
          </>,
          <>Only Talent and Admin can edit this table. Changes apply right away.</>,
        ]}
      />
    </fieldset>
  );
}
