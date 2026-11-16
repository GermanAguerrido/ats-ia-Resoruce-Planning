"use client";

import { useMemo, useState } from "react";

import { ROLE_LABELS, useCurrentUser, type UserRole } from "@/app/lib/currentUser";
import {
  LEVEL_LABELS,
  PERMISSION_AREAS,
  ROLE_ORDER,
  defaultPermissions,
  levelOf,
  resetPermissions,
  savePermissions,
  usePermissions,
  type AccessLevel,
  type AreaId,
} from "@/app/lib/permissions";
import { getUserInitials } from "@/app/lib/users";
import { saveUsers, useUsers, type AppUser } from "@/app/lib/userDirectory";
import { UserDialog } from "./UserDialog";

type Tab = "users" | "matrix" | "preview";

const TAB_LABELS: Record<Tab, string> = {
  users: "Users",
  matrix: "Roles and permissions",
  preview: "What each role sees",
};

const LEVEL_COLORS: Record<AccessLevel, string> = {
  full: "#15803d",
  own: "#b45309",
  view: "#b45309",
  none: "#69728a",
};

function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold app-border"
      style={color ? { color, borderColor: `${color}66` } : undefined}
    >
      {children}
    </span>
  );
}

function formatAccess(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

/** Sección D: usuarios, roles y permisos. Solo entra quien tenga el permiso "Users and permissions". */
export function UsersAdmin() {
  const { user: me } = useCurrentUser();
  const users = useUsers();
  const matrix = usePermissions();
  const [tab, setTab] = useState<Tab>("users");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<{ user: AppUser | null } | null>(null);
  const [toast, setToast] = useState("");

  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2200);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter(
      (user) =>
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.company ?? "").toLowerCase().includes(q)
    );
  }, [users, query]);

  const activeOwners = users.filter((user) => user.role === "admin" && user.status !== "disabled");

  const save = (next: AppUser) => {
    const exists = users.some((user) => user.name === next.name);

    saveUsers(exists ? users.map((user) => (user.name === next.name ? next : user)) : [...users, next]);
    setDialog(null);
    flash(exists ? "User updated" : next.auth === "own" ? "Invitation sent" : "User created");
  };

  const toggle = (user: AppUser) => {
    if (user.status !== "disabled") {
      if (user.name === me) {
        flash("You cannot disable the user you are acting as");
        return;
      }

      if (user.role === "admin" && activeOwners.length <= 1) {
        flash("There must be at least one active Owner");
        return;
      }
    }

    saveUsers(
      users.map((item) =>
        item.name === user.name
          ? {
              ...item,
              status:
                item.status === "disabled" ? (item.auth === "own" ? "invited" : "active") : "disabled",
            }
          : item
      )
    );
  };

  const setLevel = (area: AreaId, role: UserRole, level: AccessLevel) => {
    savePermissions({ ...matrix, [area]: { ...matrix[area], [role]: level } });
    flash("Permission updated");
  };

  const groups = Array.from(new Set(PERMISSION_AREAS.map((area) => area.group)));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={tab === key ? { backgroundColor: "#7c3aed", color: "#fff", borderColor: "#7c3aed" } : undefined}
            className="rounded-xl border px-4 py-2 text-sm font-semibold app-border app-text-secondary hover:border-violet-500"
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "users" && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email or consultora"
                className="app-input w-72 rounded-xl border px-3 py-2 text-sm outline-none"
              />

              <button
                type="button"
                onClick={() => setDialog({ user: null })}
                style={{ backgroundColor: "#7c3aed", color: "#fff" }}
                className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                + New user
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border app-border app-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
                    <th className="px-4 py-2.5 font-semibold">User</th>
                    <th className="px-4 py-2.5 font-semibold">Role</th>
                    <th className="px-4 py-2.5 font-semibold">Sign-in</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Last access</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.name} className="border-t app-border">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="rp-avatar-badge flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                            {getUserInitials(user.name)}
                          </span>

                          <div>
                            <p className="font-semibold app-text-primary">
                              {user.name}
                              {user.name === me && (
                                <span className="ml-2 text-[11px] font-normal app-text-muted">(you)</span>
                              )}
                            </p>
                            <p className="text-xs app-text-muted">
                              {user.email || "no email yet"}
                              {user.company ? ` · ${user.company}` : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2.5">
                        <Pill color="#7c3aed">{ROLE_LABELS[user.role]}</Pill>
                      </td>

                      <td className="px-4 py-2.5">
                        <Pill color={user.auth === "google" ? "#1d4ed8" : undefined}>
                          {user.auth === "google" ? "Google (company account)" : "Own credentials"}
                        </Pill>
                      </td>

                      <td className="px-4 py-2.5">
                        {user.status === "active" ? (
                          <Pill color="#15803d">Active</Pill>
                        ) : user.status === "invited" ? (
                          <Pill color="#b45309">Invitation sent</Pill>
                        ) : (
                          <Pill color="#b91c1c">Disabled</Pill>
                        )}
                      </td>

                      <td className="px-4 py-2.5 text-xs app-text-muted">{formatAccess(user.lastAccess)}</td>

                      <td className="whitespace-nowrap px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setDialog({ user })}
                          className="rounded-lg border px-2.5 py-1 text-xs font-semibold app-border hover:border-violet-500"
                        >
                          Edit
                        </button>

                        {user.status === "invited" && (
                          <button
                            type="button"
                            onClick={() => flash(`Invitation sent again to ${user.email || user.name}`)}
                            className="ml-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold app-border hover:border-violet-500"
                          >
                            Resend invite
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggle(user)}
                          className="ml-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold app-border hover:border-violet-500"
                          style={user.status !== "disabled" ? { color: "#b91c1c" } : undefined}
                        >
                          {user.status === "disabled" ? "Enable" : "Disable"}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm app-text-muted">
                        No users match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 list-disc space-y-1 rounded-xl border px-8 py-3 text-xs app-border app-text-muted">
              <li>
                <b>Team</b> signs in with the Google company account. No password to manage.
              </li>
              <li>
                <b>Consultora</b> gets its own user with the consultora&apos;s email and a password it sets from the
                invitation.
              </li>
              <li>
                Disabling a user keeps their history (comments, candidates, activity) and blocks the sign-in. Nobody is
                deleted.
              </li>
              <li>
                Provisional: until the backend exists, users are saved in this browser and invitations are not really
                sent.
              </li>
            </ul>
          </>
        )}

        {tab === "matrix" && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <p className="max-w-3xl text-xs app-text-muted">
                Each row is an area of the app; pick the level per role. The Owner is fixed (full access). Rows marked{" "}
                <b>Soon</b> can be configured but take effect when that module exists.
              </p>

              <button
                type="button"
                onClick={() => {
                  resetPermissions();
                  flash("Default permissions restored");
                }}
                disabled={JSON.stringify(matrix) === JSON.stringify(defaultPermissions())}
                className="ml-auto rounded-lg border px-3 py-1.5 text-xs font-semibold app-border hover:border-violet-500 disabled:opacity-40"
              >
                Restore defaults
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border app-border app-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
                    <th className="px-4 py-2.5 font-semibold">Area</th>
                    {ROLE_ORDER.map((role) => (
                      <th key={role} className="px-4 py-2.5 text-center font-semibold">
                        {ROLE_LABELS[role]}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {groups.map((group) => (
                    <GroupRows key={group} group={group} matrix={matrix} onChange={setLevel} />
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 list-disc space-y-1 rounded-xl border px-8 py-3 text-xs app-border app-text-muted">
              <li>
                <b>Full</b>: sees and edits. <b>View only</b>: sees, cannot change. <b>Own only</b>: only what belongs
                to the user.
              </li>
              <li>The consultora never sees internal candidates, other consultoras&apos; profiles or budgets.</li>
              <li>Changes apply right away to the menu and to each screen.</li>
            </ul>
          </>
        )}

        {tab === "preview" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ROLE_ORDER.map((role) => {
              const names = users.filter((user) => user.role === role).map((user) => user.name);
              const allowed = PERMISSION_AREAS.filter((area) => levelOf(role, area.id, matrix) !== "none");
              const denied = PERMISSION_AREAS.filter((area) => levelOf(role, area.id, matrix) === "none");

              return (
                <div key={role} className="rounded-2xl border p-4 app-border app-card">
                  <h3 className="font-bold app-text-primary">{ROLE_LABELS[role]}</h3>
                  <p className="mb-3 text-xs app-text-muted">{names.join(", ") || "No users"}</p>

                  <p className="text-xs font-semibold app-text-primary">Sees</p>
                  <ul className="mb-3 mt-1 list-disc space-y-0.5 pl-5 text-xs app-text-secondary">
                    {allowed.map((area) => (
                      <li key={area.id}>
                        {area.label}{" "}
                        <span style={{ color: LEVEL_COLORS[levelOf(role, area.id, matrix)] }}>
                          ({levelOf(role, area.id, matrix) === "full"
                            ? "full"
                            : levelOf(role, area.id, matrix) === "own"
                              ? "own only"
                              : "view"}
                          )
                        </span>
                      </li>
                    ))}
                  </ul>

                  <p className="text-xs font-semibold app-text-primary">Does not see</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs app-text-muted">
                    {denied.map((area) => (
                      <li key={area.id}>{area.label}</li>
                    ))}

                    {denied.length === 0 && <li>—</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {dialog && (
        <UserDialog
          user={dialog.user}
          existingNames={users.map((user) => user.name)}
          onClose={() => setDialog(null)}
          onSave={save}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function GroupRows({
  group,
  matrix,
  onChange,
}: {
  group: string;
  matrix: ReturnType<typeof usePermissions>;
  onChange: (area: AreaId, role: UserRole, level: AccessLevel) => void;
}) {
  return (
    <>
      <tr>
        <td colSpan={ROLE_ORDER.length + 1} className="bg-black/[0.04] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide app-text-muted dark:bg-white/[0.05]">
          {group}
        </td>
      </tr>

      {PERMISSION_AREAS.filter((area) => area.group === group).map((area) => (
        <tr key={area.id} className="border-t app-border">
          <td className="px-4 py-2">
            <span className="app-text-primary">{area.label}</span>
            {!area.enforced && (
              <span className="ml-2 rounded-full border px-1.5 py-0.5 text-[10px] font-bold app-border app-text-muted">
                Soon
              </span>
            )}
          </td>

          {ROLE_ORDER.map((role) => {
            const level = matrix[area.id][role];

            return (
              <td key={role} className="px-4 py-2 text-center">
                {role === "admin" ? (
                  <span style={{ color: LEVEL_COLORS.full, fontWeight: 600 }}>{LEVEL_LABELS.full}</span>
                ) : (
                  <select
                    value={level}
                    onChange={(event) => onChange(area.id, role, event.target.value as AccessLevel)}
                    className="app-input rounded-lg border px-2 py-1 text-xs outline-none"
                  >
                    {area.levels.map((item) => (
                      <option key={item} value={item}>
                        {LEVEL_LABELS[item]}
                      </option>
                    ))}
                  </select>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
