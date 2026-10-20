"use client";

import { useMemo, useState } from "react";
import type { BudgetConfig, BudgetMatrix } from "@/app/lib/candidateBudget";
import { formatMoney } from "@/app/lib/candidateBudget";
import { ENGLISH_LEVELS } from "@/app/lib/englishLevels";
import { roleKey, SENIORITY_BANDS } from "@/app/lib/roles";
import { Tag } from "./CandidatesStyles";

type Props = {
  config: BudgetConfig;
  onChange: (next: BudgetConfig) => void;
  // Roles que ya aparecen en la base o en posiciones abiertas
  knownRoles: string[];
  clients: string[];
};

const GENERAL = "__general__";

/** Presupuesto por rol y seniority (general o por cliente) y margen negociable. */
export function BudgetPanel({ config, onChange, knownRoles, clients }: Props) {
  const [scope, setScope] = useState(GENERAL);
  const [newRole, setNewRole] = useState("");
  const isGeneral = scope === GENERAL;
  const matrix: BudgetMatrix = isGeneral ? config.general : (config.clients[scope] ?? {});

  const roles = useMemo(() => {
    const seen = new Map<string, string>();

    [...Object.keys(config.general), ...Object.keys(matrix), ...knownRoles].forEach((name) => {
      const key = roleKey(name);

      if (key && !seen.has(key)) {
        seen.set(key, name);
      }
    });

    return Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  }, [config.general, matrix, knownRoles]);

  const entryFor = (source: BudgetMatrix, role: string) => {
    const key = roleKey(role);
    const name = Object.keys(source).find((item) => roleKey(item) === key);

    return name ? { name, values: source[name] } : null;
  };

  const writeMatrix = (next: BudgetMatrix) => {
    onChange(
      isGeneral
        ? { ...config, general: next }
        : { ...config, clients: { ...config.clients, [scope]: next } }
    );
  };

  const setCell = (role: string, band: (typeof SENIORITY_BANDS)[number], raw: string) => {
    const existing = entryFor(matrix, role);
    const name = existing?.name ?? role;
    const values = { ...(existing?.values ?? {}) };
    const amount = parseInt(raw.replace(/\D/g, ""), 10);

    if (Number.isNaN(amount)) {
      delete values[band];
    } else {
      values[band] = amount;
    }

    writeMatrix({ ...matrix, [name]: values });
  };

  const addRole = () => {
    const name = newRole.trim();

    if (!name || entryFor(matrix, name)) {
      setNewRole("");
      return;
    }

    writeMatrix({ ...matrix, [name]: {} });
    setNewRole("");
  };

  const inputClass = "app-input w-24 rounded-lg border px-2 py-1 text-sm";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border p-4 app-border app-card">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold app-text-primary">Budget table</h2>
          <span className="text-xs app-text-muted">USD per month, by role and seniority</span>

          <select
            value={scope}
            onChange={(event) => setScope(event.target.value)}
            className="app-input ml-auto rounded-xl border px-3 py-1.5 text-sm"
          >
            <option value={GENERAL}>General budget</option>
            {clients.map((client) => (
              <option key={client} value={client}>
                Client · {client}
              </option>
            ))}
          </select>
        </div>

        {!isGeneral && (
          <p className="mb-2 text-xs app-text-muted">
            Empty cells use the general budget. Fill one in to override it for this client.
          </p>
        )}

        <div className="overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide app-text-muted">
                <th className="px-2 py-2">Role</th>
                {SENIORITY_BANDS.map((band) => (
                  <th key={band} className="px-2 py-2">
                    {band}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {roles.map((role) => {
                const own = entryFor(matrix, role)?.values ?? {};
                const general = entryFor(config.general, role)?.values ?? {};

                return (
                  <tr key={role} className="border-t app-border">
                    <td className="px-2 py-2 font-medium app-text-primary">{role}</td>
                    {SENIORITY_BANDS.map((band) => (
                      <td key={band} className="px-2 py-1.5">
                        <input
                          inputMode="numeric"
                          value={own[band] !== undefined ? String(own[band]) : ""}
                          placeholder={!isGeneral && general[band] ? formatMoney(general[band]) : "—"}
                          onChange={(event) => setCell(role, band, event.target.value)}
                          className={inputClass}
                          aria-label={`${role} ${band} budget`}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={newRole}
            onChange={(event) => setNewRole(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addRole();
            }}
            placeholder="Add a role…"
            className="app-input rounded-xl border px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={addRole}
            className="rounded-xl border px-3 py-1.5 text-sm font-medium app-border app-text-secondary hover:border-violet-500"
          >
            Add
          </button>
        </div>
      </section>

      <section className="rounded-2xl border p-4 app-border app-card">
        <h2 className="mb-3 text-sm font-semibold app-text-primary">Rules</h2>

        <div className="flex flex-wrap items-center gap-3 text-sm app-text-secondary">
          <label className="flex items-center gap-2">
            Negotiable margin (USD)
            <input
              inputMode="numeric"
              value={String(config.margin)}
              onChange={(event) => {
                const amount = parseInt(event.target.value.replace(/\D/g, ""), 10);

                onChange({ ...config, margin: Number.isNaN(amount) ? 0 : amount });
              }}
              className={inputClass}
            />
          </label>

          <span className="flex flex-wrap items-center gap-2">
            Expected salary:
            <Tag tone="green" small>
              within budget
            </Tag>
            <Tag tone="amber" small>
              up to +{formatMoney(config.margin)}
            </Tag>
            <Tag tone="red" small>
              above
            </Tag>
          </span>
        </div>

        <h3 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide app-text-muted">
          Minimum English by seniority
        </h3>

        <div className="flex flex-wrap gap-3">
          {SENIORITY_BANDS.map((band) => (
            <label key={band} className="text-xs app-text-secondary">
              {band}
              <select
                value={config.englishMin[band]}
                onChange={(event) =>
                  onChange({
                    ...config,
                    englishMin: { ...config.englishMin, [band]: event.target.value },
                  })
                }
                className="app-input mt-1 block rounded-lg border px-2 py-1 text-sm"
              >
                {ENGLISH_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <p className="mt-4 text-xs app-text-muted">
          A person above the budget by more than the margin, or below the seniority or English the
          position asks for, is marked in red. It is a warning, not a discard: an exception is still
          possible.
        </p>
      </section>
    </div>
  );
}
