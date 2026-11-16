"use client";

import { ROLE_LABELS, useCurrentUser } from "@/app/lib/currentUser";
import { useUsers } from "@/app/lib/userDirectory";

/** Selector provisorio del usuario activo, para probar permisos hasta tener login. */
export function CurrentUserSwitcher() {
  const { user, role, setUser } = useCurrentUser();
  const users = useUsers();

  return (
    <label
      className="inline-flex items-center gap-2 text-xs app-text-muted"
      title="Provisional: simulates the logged-in user until the backend is ready"
    >
      Acting as
      <select
        value={user}
        onChange={(event) => setUser(event.target.value)}
        className="app-input rounded-lg border px-2 py-1.5 text-xs font-semibold outline-none"
      >
        {users
          .filter((item) => item.status !== "disabled")
          .map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
      </select>
      <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold app-border">
        {ROLE_LABELS[role]}
      </span>
    </label>
  );
}
