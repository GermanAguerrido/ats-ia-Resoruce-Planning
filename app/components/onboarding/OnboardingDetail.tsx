"use client";

import {
  STEP_HINTS,
  STEP_LABELS,
  STATUS_LABELS,
  formatTemplateDate,
  stepIndex,
  type OnboardingRecord,
  type OnboardingStep,
} from "@/app/lib/onboarding";
import type { UserRole } from "@/app/lib/currentUser";
import { Tag } from "../candidates/CandidatesStyles";

const STEPS: OnboardingStep[] = ["it", "hr", "pm"];

export function statusTone(status: OnboardingRecord["status"] | "no_file") {
  return status === "complete" ? "green" : status === "no_file" ? "red" : "amber";
}

function Line({ label, value }: { label: string; value?: string }) {
  return (
    <p className="text-xs app-text-secondary">
      <b className="app-text-primary">{label}:</b> {value || "—"}
    </p>
  );
}

function Card({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-xl border p-3 app-border app-card">
      <h4 className="mb-1 flex items-center gap-2 text-xs font-bold app-text-primary">
        {title}
        {badge && (
          <Tag tone="violet" small>
            {badge}
          </Tag>
        )}
      </h4>
      {children}
    </div>
  );
}

function Hidden({ children }: { children: React.ReactNode }) {
  return <p className="text-xs line-through opacity-50 app-text-muted">{children}</p>;
}

/** Lo que recibe cada área: IT lo mínimo, HR la ficha completa, PM / Lead lo del ingreso. */
function ReceivedCards({ record, role }: { record: OnboardingRecord; role: UserRole }) {
  const file = record.file;
  const name = `${file.firstName} ${file.lastName}`;

  const it = (
    <Card key="it" title="IT" badge="minimum data">
      <Line label="Name" value={name} />
      <Line label="Personal email" value={file.personalEmail} />
      <Line label="Corporate email" value={record.corporateEmail ?? `${file.email} (suggested)`} />
      <Hidden>Salary · address · ID number</Hidden>
    </Card>
  );
  const hr = (
    <Card key="hr" title="HR" badge="full file">
      <Line label="Name" value={name} />
      <Line label="Designation" value={`${file.designation} · ${file.department}`} />
      <Line label="Salary" value={`USD ${file.salary} (${file.salaryText})`} />
      <Line label="Date of birth" value={formatTemplateDate(file.birth)} />
      <Line label="DNI / citizenship" value={`${file.dni} · ${file.citizenship}`} />
      <Line label="Address" value={`${file.address}, ${file.city}, ${file.state}, ${file.country} ${file.zip}`} />
      <Line label="Mobile" value={file.mobile} />
      <Line label="Corporate email" value={record.corporateEmail} />
      <Line label="Employee ID (Zoho)" value={record.employeeId} />
    </Card>
  );
  const pm = (
    <Card key="pm" title="PM / Lead">
      <Line label="Joins" value={name} />
      <Line label="Designation" value={file.designation} />
      <Line label="Project" value={`${record.projectName} (${file.entry})`} />
      <Line label="Entry date" value={formatTemplateDate(file.projectEntryDate || file.joining)} />
      <Hidden>Salary · address · ID number</Hidden>
    </Card>
  );
  const info = (
    <Card key="info" title="Content · Owner · Talent">
      <Line
        label="Notice"
        value={`${name} joins ${record.projectName} on ${formatTemplateDate(file.joining)} as ${file.designation}`}
      />
      <Hidden>Salary · address · ID number</Hidden>
    </Card>
  );

  const cards = role === "it" ? [it] : role === "hr" ? [hr] : role === "pm" ? [pm] : [it, hr, pm, info];

  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards}</div>;
}

export function OnboardingDetail({
  record,
  role,
  canAct,
  canEdit,
  onStep,
  onEdit,
  onClose,
}: {
  record: OnboardingRecord;
  role: UserRole;
  canAct: (step: OnboardingStep) => boolean;
  canEdit: boolean;
  onStep: (step: OnboardingStep) => void;
  onEdit: () => void;
  onClose: () => void;
}) {
  const index = stepIndex(record.status);
  const name = `${record.file.firstName} ${record.file.lastName}`;
  const own = role === "it" || role === "hr" || role === "pm";

  return (
    <div className="rounded-2xl border p-4 app-border app-card">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold app-text-primary">{name}</h3>
        <Tag tone={statusTone(record.status)} small>
          {STATUS_LABELS[record.status]}
        </Tag>
        <span className="text-xs app-text-muted">
          {record.file.designation} · {record.projectName}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-lg border px-3 py-1 text-xs font-semibold app-border hover:border-violet-500"
        >
          Close
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-stretch gap-2">
        <div className="min-w-[150px] flex-1 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3">
          <p className="text-xs font-bold app-text-primary">Recruiter ✓</p>
          <p className="text-xs app-text-muted">
            File sent {formatTemplateDate(record.sentAt)} by {record.recruiter}
          </p>
        </div>

        {STEPS.map((step, position) => {
          const done = index > position;
          const now = index === position;

          return (
            <div key={step} className="flex min-w-[170px] flex-1 items-center gap-2">
              <span className="app-text-muted">→</span>
              <div
                className={`flex-1 rounded-xl border p-3 ${
                  done
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : now
                      ? "border-violet-500 shadow-[0_0_0_2px_rgba(124,58,237,0.2)]"
                      : "app-border opacity-60"
                }`}
              >
                <p className="text-xs font-bold app-text-primary">
                  {STEP_LABELS[step]} {done ? "✓" : ""}
                </p>
                <p className="text-xs app-text-muted">{STEP_HINTS[step]}</p>

                {step === "it" && record.corporateEmail && (
                  <p className="mt-1 text-xs app-text-secondary">
                    Email: <b>{record.corporateEmail}</b>
                  </p>
                )}
                {step === "hr" && record.employeeId && (
                  <p className="mt-1 text-xs app-text-secondary">
                    Employee ID: <b>{record.employeeId}</b>
                  </p>
                )}
                {step === "hr" && record.interviewDate && (
                  <p className="text-xs app-text-secondary">
                    Interview: <b>{formatTemplateDate(record.interviewDate)}</b>
                  </p>
                )}

                {now && canAct(step) && (
                  <button
                    type="button"
                    onClick={() => onStep(step)}
                    style={{ backgroundColor: "#7c3aed", color: "#fff" }}
                    className="mt-2 rounded-lg px-3 py-1 text-xs font-semibold hover:opacity-90"
                  >
                    Complete {STEP_LABELS[step]} step
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {record.status === "complete" && (
        <p className="mt-3 rounded-xl border border-emerald-500/40 px-3 py-2 text-sm text-emerald-600">
          Everything is done. The hire is Internal and the corporate email is saved on the person&apos;s profile.
        </p>
      )}

      <p className="mb-2 mt-4 text-[11px] font-extrabold uppercase tracking-wide text-violet-500">
        {own ? "Data for your step" : "What each area received"}
      </p>

      <ReceivedCards record={record} role={role} />

      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 rounded-lg border px-3 py-1 text-xs font-semibold app-border hover:border-violet-500"
        >
          Edit file
        </button>
      )}
    </div>
  );
}
