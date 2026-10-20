"use client";

import { useMemo } from "react";
import { INTERNAL_USERS } from "@/app/lib/users";
import { getRoleOf } from "@/app/lib/currentUser";
import { isHiredCandidate } from "@/app/lib/candidateStatus";
import {
  pushNotification,
  stateOf,
  useAllNotifications,
} from "@/app/lib/notifications";
import { buildRoleDemand } from "@/app/lib/roleDemand";
import { COVERAGE_RATIO_OPTIONS, useCoverageRatio } from "@/app/lib/sourcingRule";
import { useBoardSnapshot } from "@/app/lib/todoItems";

type Props = {
  user: string;
  onAsked: (message: string) => void;
};

const tagClass = "rounded-full border px-2 py-0.5 text-[11px] font-bold";

/** Roles donde faltan perfiles para las posiciones abiertas. Talent pide sourcing a las recruiters. */
export function SourcingPanel({ user, onAsked }: Props) {
  const projects = useBoardSnapshot();
  const notifications = useAllNotifications();
  const [ratio, setRatio] = useCoverageRatio();

  const demand = useMemo(() => {
    const people = new Map<string, { role: string; seniority: string }>();

    projects.forEach((project) =>
      project.positions.forEach((position) =>
        position.candidates.forEach((candidate) => {
          if (!isHiredCandidate(candidate) && !people.has(candidate.id)) {
            people.set(candidate.id, {
              role: candidate.role,
              seniority: candidate.seniority || position.seniority,
            });
          }
        })
      )
    );

    return buildRoleDemand(Array.from(people.values()), projects, ratio).filter(
      (item) => item.open.length > 0
    );
  }, [projects, ratio]);

  const recruiters = INTERNAL_USERS.filter((name) => getRoleOf(name) === "recruiter");

  const askFor = (role: string, key: string, seniority: string, have: number, target: number) => {
    const ref = `sourcing:${key}:${seniority}`;

    recruiters.forEach((recruiter) =>
      pushNotification({
        to: recruiter,
        from: user,
        kind: "sourcing",
        state: "pending",
        ref,
        text: `${user} asks you to source profiles for ${role} ${seniority} (${have} of ${target} in the database).`,
        href: "/candidates",
      })
    );

    onAsked(`Sourcing request sent to ${recruiters.join(" and ")}.`);
  };

  return (
    <div>
      <p className="mb-3 text-xs app-text-muted">
        We want {ratio} people in the database per open position (same role, same seniority or
        higher). It is the same rule as the “Gap” flag in Candidates.
      </p>

      <div className="overflow-x-auto rounded-2xl border app-border app-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="app-table-header">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide">
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Seniority</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Open</th>
              <th className="px-4 py-3">In database</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>

          <tbody>
            {demand.flatMap((item) =>
              item.open.map((entry) => {
                const target = entry.quantity * ratio;
                const ref = `sourcing:${item.key}:${entry.seniority}`;
                const requested = notifications.some(
                  (note) => note.ref === ref && stateOf(note) === "pending"
                );

                return (
                  <tr key={entry.positionId} className="border-t app-border">
                    <td className="px-4 py-3 font-semibold app-text-primary">{item.role}</td>
                    <td className="px-4 py-3 app-text-secondary">{entry.seniority}</td>
                    <td className="px-4 py-3 app-text-secondary">{entry.clientName}</td>
                    <td className="px-4 py-3 app-text-secondary">{entry.quantity}</td>
                    <td className="px-4 py-3 app-text-secondary">{entry.supply}</td>
                    <td className="px-4 py-3 app-text-secondary">{target}</td>
                    <td className="px-4 py-3">
                      {entry.covered ? (
                        <span className={`${tagClass} border-emerald-500/50 text-emerald-500`}>
                          Covered
                        </span>
                      ) : (
                        <span className={`${tagClass} border-red-500/50 text-red-500`}>
                          Gap · {target - entry.supply} short
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!entry.covered &&
                        (requested ? (
                          <span className={`${tagClass} border-amber-500/50 text-amber-500`}>
                            Requested
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              askFor(item.role, item.key, entry.seniority, entry.supply, target)
                            }
                            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90"
                          >
                            Ask recruiters to source
                          </button>
                        ))}
                    </td>
                  </tr>
                );
              })
            )}

            {demand.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center app-text-muted">
                  There are no open positions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm app-text-secondary">
        People wanted per open position
        <select
          value={ratio}
          onChange={(event) => setRatio(Number(event.target.value))}
          className="app-input rounded-lg border px-2 py-1 text-sm"
        >
          {COVERAGE_RATIO_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
