"use client";

import { useState } from "react";

import {
  STEP_LABELS,
  formatTemplateDate,
  type OnboardingRecord,
  type OnboardingStep,
  type StepInput,
} from "@/app/lib/onboarding";
import { CORPORATE_EMAIL_DOMAIN } from "@/app/lib/userDirectory";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "../resource-planning/DialogFrame";

/** Paso de IT, HR o PM / Lead. */
export function OnboardingStepDialog({
  record,
  step,
  onClose,
  onConfirm,
}: {
  record: OnboardingRecord;
  step: OnboardingStep;
  onClose: () => void;
  onConfirm: (input: StepInput) => void;
}) {
  const { file } = record;
  const [email, setEmail] = useState(file.email);
  const [employeeId, setEmployeeId] = useState("");
  const [vacations, setVacations] = useState("");
  const [interview, setInterview] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (step === "it") {
      if (!email.trim().toLowerCase().endsWith(`@${CORPORATE_EMAIL_DOMAIN}`)) {
        setError(`Use the @${CORPORATE_EMAIL_DOMAIN} format.`);

        return;
      }

      onConfirm({ corporateEmail: email.trim() });

      return;
    }

    if (step === "hr") {
      if (!employeeId.trim() || !interview) {
        setError("Complete the required fields (*).");

        return;
      }

      onConfirm({ employeeId: employeeId.trim(), vacations: vacations.trim(), interviewDate: interview });

      return;
    }

    onConfirm({});
  };

  return (
    <DialogFrame
      title={
        step === "it"
          ? "IT · corporate email"
          : step === "hr"
            ? "HR fields"
            : "PM / Lead · confirm the entry"
      }
      subtitle={
        step === "it"
          ? "Confirm the address you created. It is saved on the person's profile and HR is notified."
          : step === "hr"
            ? "Complete the HR part of the template. The PM / Lead is notified next."
            : `${file.firstName} ${file.lastName} joins ${record.projectName} on ${formatTemplateDate(file.joining)} as ${file.designation}. Confirm that the team is ready.`
      }
      confirmLabel={`Complete ${STEP_LABELS[step]} step`}
      onClose={onClose}
      onConfirm={submit}
    >
      {step === "it" && (
        <>
          <FieldLabel required>Corporate email</FieldLabel>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className={FIELD_CLASS} />
          <p className="mt-1 text-xs app-text-muted">Must end with @{CORPORATE_EMAIL_DOMAIN}</p>
        </>
      )}

      {step === "hr" && (
        <>
          <FieldLabel required>Employee ID (Zoho)</FieldLabel>
          <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} className={FIELD_CLASS} />
          <FieldLabel>Planned vacations</FieldLabel>
          <input value={vacations} onChange={(event) => setVacations(event.target.value)} className={FIELD_CLASS} />
          <FieldLabel required>Onboarding interview date</FieldLabel>
          <input type="date" value={interview} onChange={(event) => setInterview(event.target.value)} className={FIELD_CLASS} />
        </>
      )}

      {error && <p className="mt-3 rounded-xl border border-red-500/40 px-3 py-2 text-xs text-red-500">{error}</p>}
    </DialogFrame>
  );
}
