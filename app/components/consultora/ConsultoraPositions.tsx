"use client";

import { saveConsultoraPositionSetting, type OpenPosition } from "@/app/lib/consultora";

/**
 * Posiciones abiertas para la consultora: solo posición y seniority (sin cliente, proyecto ni
 * presupuesto). Talent puede sumar una descripción y ocultar una búsqueda confidencial.
 */
export function ConsultoraPositions({
  positions,
  editable,
}: {
  positions: OpenPosition[];
  editable: boolean;
}) {
  const visible = editable ? positions : positions.filter((item) => !item.setting.hidden);

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-xs app-text-muted">
        {editable
          ? "This is what the consultora sees: position and seniority only (no client, project or budget). You can add an optional description and hide a position (for example a confidential search)."
          : "Open searches right now. It updates automatically as our team opens or closes positions."}
      </p>

      <div className="overflow-x-auto rounded-2xl border app-border app-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
              <th className="px-4 py-2.5 font-semibold">Position</th>
              <th className="px-4 py-2.5 font-semibold">Seniority</th>
              <th className="px-4 py-2.5 font-semibold">Description</th>
              {editable && <th className="px-4 py-2.5" />}
            </tr>
          </thead>

          <tbody>
            {visible.map(({ position, project, setting }) => (
              <tr
                key={position.id}
                className="border-t app-border"
                style={setting.hidden ? { opacity: 0.5 } : undefined}
              >
                <td className="px-4 py-2.5">
                  <p className="font-semibold app-text-primary">{position.title}</p>
                  {editable && <p className="text-xs app-text-muted">{project.projectName}</p>}
                </td>
                <td className="px-4 py-2.5 app-text-secondary">{position.seniority}</td>
                <td className="px-4 py-2.5">
                  {editable ? (
                    <input
                      key={`${position.id}-${setting.desc ?? ""}`}
                      defaultValue={setting.desc ?? ""}
                      placeholder="Optional note for the consultora"
                      onBlur={(event) => {
                        if (event.target.value !== (setting.desc ?? "")) {
                          saveConsultoraPositionSetting(position.id, { desc: event.target.value.trim() });
                        }
                      }}
                      className="app-input w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none"
                    />
                  ) : (
                    <span className="app-text-secondary">{setting.desc || <span className="app-text-muted">—</span>}</span>
                  )}
                </td>
                {editable && (
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => saveConsultoraPositionSetting(position.id, { hidden: !setting.hidden })}
                      className="rounded-lg border px-2.5 py-1 text-xs font-semibold app-border hover:border-violet-500"
                    >
                      {setting.hidden ? "Show" : "Hide"}
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {visible.length === 0 && (
              <tr>
                <td colSpan={editable ? 4 : 3} className="px-4 py-10 text-center text-sm app-text-muted">
                  There are no open positions right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
