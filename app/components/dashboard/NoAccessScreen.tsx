"use client";

import { CurrentUserSwitcher } from "../resource-planning/CurrentUserSwitcher";

/**
 * Pantalla para quien no puede entrar a un área (hoy: la consultora en el Dashboard y en
 * Resource Planning). Incluye el selector "Acting as" para poder volver a otro usuario mientras
 * no haya login.
 */
export function NoAccessScreen({ area }: { area: string }) {
  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <div className="mx-auto max-w-[640px]">
        <div className="flex justify-end">
          <CurrentUserSwitcher />
        </div>

        <div className="mt-16 rounded-2xl border px-8 py-14 text-center app-border app-card">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-3 text-2xl font-bold app-text-primary">No access</h1>
          <p className="mt-2 text-sm app-text-secondary">
            Your user does not have access to {area}. If you need it, ask the Owner to change your
            permissions.
          </p>
        </div>
      </div>
    </div>
  );
}
