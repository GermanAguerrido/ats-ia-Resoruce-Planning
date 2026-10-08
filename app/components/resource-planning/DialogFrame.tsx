"use client";

import { useEffect, type ReactNode } from "react";

/** Marco común de los diálogos nuevos (cambio de etapa, entrevista técnica). */
export function DialogFrame({
  title,
  subtitle,
  children,
  confirmLabel,
  confirmDisabled = false,
  hint,
  wide = false,
  onClose,
  onConfirm,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  confirmLabel: string;
  confirmDisabled?: boolean;
  hint?: string;
  wide?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-[6vh] backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full overflow-hidden rounded-2xl border shadow-2xl app-border app-card ${
          wide ? "max-w-[640px]" : "max-w-[520px]"
        }`}
      >
        <div className="px-6 pb-2 pt-5">
          <h3 className="text-lg font-semibold app-text-primary">{title}</h3>

          {subtitle && <div className="mt-1 text-xs app-text-muted">{subtitle}</div>}
        </div>

        <div className="max-h-[62vh] overflow-y-auto px-6 pb-4">{children}</div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4 app-border">
          {hint && <span className="mr-auto text-xs app-text-muted">{hint}</span>}

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm font-medium app-border app-text-secondary hover:bg-black/[0.04]"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            style={{ backgroundColor: "#7c3aed", color: "#ffffff" }}
            className="rounded-xl px-5 py-2 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FieldLabel({
  children,
  required = false,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <span className="mb-1.5 mt-3 block text-xs font-semibold app-text-secondary">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </span>
  );
}

export const FIELD_CLASS =
  "app-input w-full rounded-xl border px-3 py-2 text-sm outline-none";
