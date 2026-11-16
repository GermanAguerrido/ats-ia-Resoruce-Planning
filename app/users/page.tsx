"use client";

import { NoAccessScreen } from "../components/dashboard/NoAccessScreen";
import { CurrentUserSwitcher } from "../components/resource-planning/CurrentUserSwitcher";
import { UsersAdmin } from "../components/users/UsersAdmin";
import { useCurrentUser } from "../lib/currentUser";
import { canAccess, usePermissions } from "../lib/permissions";

export default function UsersPage() {
  const { role } = useCurrentUser();
  const permissions = usePermissions();

  if (!canAccess(role, "users", permissions)) {
    return <NoAccessScreen area="Users and permissions" />;
  }

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <div className="mx-auto max-w-[1300px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold app-text-primary">Users and permissions</h1>
            <p className="mt-3 max-w-2xl text-sm app-text-secondary">
              Create users, choose their role and decide what each role can see. By default only the Owner opens this
              screen.
            </p>
          </div>

          <CurrentUserSwitcher />
        </div>

        <div className="mt-6">
          <UsersAdmin />
        </div>
      </div>
    </div>
  );
}
