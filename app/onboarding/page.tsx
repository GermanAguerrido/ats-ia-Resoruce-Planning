"use client";

import { useEffect, useMemo, useState } from "react";

import { CandidatesStyles, Tag } from "../components/candidates/CandidatesStyles";
import { NoAccessScreen } from "../components/dashboard/NoAccessScreen";
import { OnboardingDetail, statusTone } from "../components/onboarding/OnboardingDetail";
import { emptyFile, OnboardingFileDialog } from "../components/onboarding/OnboardingFileDialog";
import { OnboardingStepDialog } from "../components/onboarding/OnboardingStepDialog";
import { CurrentUserSwitcher } from "../components/resource-planning/CurrentUserSwitcher";
import { useBoardState } from "../hooks/useBoardState";
import { useCurrentUser } from "../lib/currentUser";
import {
  STATUS_LABELS,
  completeStep,
  editOnboardingFile,
  formatTemplateDate,
  listPendingHires,
  sendOnboardingFile,
  useOnboarding,
  type OnboardingFile,
  type OnboardingRecord,
  type OnboardingStep,
  type PendingHire,
  type StepInput,
} from "../lib/onboarding";
import { levelOf, usePermissions } from "../lib/permissions";
import { useUsers } from "../lib/userDirectory";

const PRIMARY = { backgroundColor: "#7c3aed", color: "#ffffff", borderColor: "#7c3aed" };

function prefill(hire: PendingHire): OnboardingFile {
  const { candidate, position } = hire;
  const [first, ...rest] = candidate.name.trim().split(/\s+/);

  return emptyFile({
    firstName: first ?? "",
    lastName: rest.join(" "),
    designation: candidate.role || position.title,
    location: candidate.location ?? "",
    source: candidate.source ?? "ATS",
    seniority: candidate.seniority ?? "Senior",
    english: candidate.englishLevel ?? "",
    personalEmail: candidate.email ?? "",
    linkedin: candidate.linkedin ?? "",
    portfolio: candidate.portfolio ?? "",
    joining: candidate.startDate ?? "",
    salary: (candidate.salaryExpected ?? "").replace(/[^\d]/g, ""),
  });
}

export default function OnboardingPage() {
  const { user, role } = useCurrentUser();
  const permissions = usePermissions();
  const users = useUsers();
  const store = useOnboarding();
  const board = useBoardState();
  const [openId, setOpenId] = useState<string | null>(null);
  const [fileFor, setFileFor] = useState<{ hire: PendingHire | null; record: OnboardingRecord | null } | null>(null);
  const [stepFor, setStepFor] = useState<{ record: OnboardingRecord; step: OnboardingStep } | null>(null);
  const [toast, setToast] = useState("");

  // Enlace directo desde las notificaciones: /onboarding?open=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("open");

    if (id) {
      setOpenId(id);
    }
  }, []);

  const level = levelOf(role, "onboarding", permissions);
  const full = level === "full";
  const projects = board.orderedProjects;
  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2600);
  };

  const pending = useMemo(
    () =>
      listPendingHires(projects, store).filter(
        (hire) => full || (role === "recruiter" && hire.candidate.recruiterOwner === user)
      ),
    [projects, store, full, role, user]
  );

  const records = useMemo(() => {
    const all = Object.values(store.records);

    return all
      .filter((record) => {
        if (full) return true;
        if (role === "recruiter") return record.recruiter === user;
        if (role === "pm") return record.file.ref === user;

        return role === "it" || role === "hr";
      })
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  }, [store, full, role, user]);

  if (level === "none") {
    return <NoAccessScreen area="the Onboarding process" />;
  }

  const canAct = (record: OnboardingRecord, step: OnboardingStep) =>
    record.status === step && (full || role === step);
  const canEdit = (record: OnboardingRecord) => full || (role === "recruiter" && record.recruiter === user);
  const referents = users.filter((item) => item.role === "pm" && item.status !== "disabled");
  const projectNames = projects.map((project) => project.projectName);

  const waiting =
    pending.length +
    records.filter((record) => (["it", "hr", "pm"] as OnboardingStep[]).some((step) => canAct(record, step))).length;
  const inProgress = records.filter((record) => record.status !== "complete").length;
  const complete = records.filter((record) => record.status === "complete").length;
  const open = openId ? records.find((record) => record.candidateId === openId) : undefined;
  const pendingOpen = openId ? pending.find((hire) => hire.candidate.id === openId) : undefined;

  const handleFile = (file: OnboardingFile, projectName: string) => {
    if (!fileFor) return;

    if (fileFor.record) {
      editOnboardingFile(fileFor.record.candidateId, file, projectName);
      flash("File updated");
    } else if (fileFor.hire) {
      const { candidate, position, project } = fileFor.hire;

      sendOnboardingFile(candidate, position, project, file, user);
      setOpenId(candidate.id);
      flash("File sent · IT notified (name and personal email only)");
    }

    setFileFor(null);
  };

  const handleStep = (input: StepInput) => {
    if (!stepFor) return;

    const { record, step } = stepFor;

    completeStep(record, step, input, user);

    if (step === "it" && input.corporateEmail) {
      // El mail corporativo queda en el perfil de la persona
      board.updateCandidate(record.candidateId, { corporateEmail: input.corporateEmail });
    }

    flash(
      step === "it"
        ? "HR notified with the full file"
        : step === "hr"
          ? "PM / Lead notified"
          : "Onboarding complete · Talent and Owner notified"
    );
    setStepFor(null);
  };

  const rows: Array<{ id: string; name: string; designation: string; project: string; joining?: string; recruiter: string; status: OnboardingRecord["status"] | "no_file"; record?: OnboardingRecord; hire?: PendingHire }> = [
    ...pending.map((hire) => ({
      id: hire.candidate.id,
      name: hire.candidate.name,
      designation: hire.candidate.role || hire.position.title,
      project: hire.project.projectName,
      joining: hire.candidate.startDate,
      recruiter: hire.candidate.recruiterOwner ?? "—",
      status: "no_file" as const,
      hire,
    })),
    ...records.map((record) => ({
      id: record.candidateId,
      name: `${record.file.firstName} ${record.file.lastName}`,
      designation: record.file.designation,
      project: record.projectName,
      joining: record.file.joining,
      recruiter: record.recruiter,
      status: record.status,
      record,
    })),
  ];

  return (
    <div className="min-h-screen app-bg px-8 py-8">
      <CandidatesStyles />

      <div className="mx-auto max-w-[1300px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold app-text-primary">Onboarding process</h1>
            <p className="mt-3 max-w-3xl text-sm app-text-secondary">
              Each role completes its own step. The recruiter fills the personal and job data and sends the file; then IT,
              HR and the PM / Lead complete theirs. Each person only sees the data their step needs.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <img src="/trick-studios-logo.png" alt="Trick Studios" className="h-12 w-auto" />
            <CurrentUserSwitcher />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Waiting for you", waiting],
            ["In progress", inProgress],
            ["Complete", complete],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border p-4 app-border app-card">
              <p className="text-3xl font-extrabold app-text-primary">{value}</p>
              <p className="text-xs app-text-muted">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border app-border app-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide app-text-muted">
                {["Hire", "Designation", "Project", "Date of joining", "Recruiter", "Status", ""].map((head) => (
                  <th key={head} className="px-4 py-2.5 font-semibold">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => {
                const needs = row.record
                  ? (["it", "hr", "pm"] as OnboardingStep[]).some((step) => canAct(row.record as OnboardingRecord, step))
                  : true;

                return (
                  <tr key={row.id} className="border-t app-border">
                    <td className="px-4 py-2.5 font-semibold app-text-primary">{row.name}</td>
                    <td className="px-4 py-2.5 app-text-secondary">{row.designation}</td>
                    <td className="px-4 py-2.5 app-text-secondary">{row.project}</td>
                    <td className="px-4 py-2.5 text-xs app-text-secondary">{formatTemplateDate(row.joining)}</td>
                    <td className="px-4 py-2.5 app-text-secondary">{row.recruiter}</td>
                    <td className="px-4 py-2.5">
                      <Tag tone={statusTone(row.status)} small>
                        {STATUS_LABELS[row.status]}
                      </Tag>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setOpenId(openId === row.id ? null : row.id)}
                        style={needs && row.status !== "complete" ? PRIMARY : undefined}
                        className="rounded-lg border px-3 py-1.5 text-xs font-semibold app-border hover:border-violet-500"
                      >
                        {needs && row.status !== "complete" ? "Complete my step" : "Open"}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm app-text-muted">
                    Nothing here yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          {pendingOpen && (
            <div className="rounded-2xl border p-4 app-border app-card">
              <h3 className="text-lg font-bold app-text-primary">{pendingOpen.candidate.name}</h3>
              <p className="mt-1 text-sm app-text-secondary">
                Hired on {formatTemplateDate(pendingOpen.candidate.hiredAt)}. The file is not sent yet: until it is, IT, HR
                and the PM do not know this person is joining.
              </p>
              <button
                type="button"
                onClick={() => setFileFor({ hire: pendingOpen, record: null })}
                style={PRIMARY}
                className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Complete onboarding file
              </button>
            </div>
          )}

          {open && (
            <OnboardingDetail
              record={open}
              role={role}
              canAct={(step) => canAct(open, step)}
              canEdit={canEdit(open)}
              onStep={(step) => setStepFor({ record: open, step })}
              onEdit={() => setFileFor({ hire: null, record: open })}
              onClose={() => setOpenId(null)}
            />
          )}
        </div>

        <ul className="mt-5 list-disc space-y-1 rounded-xl border px-8 py-3 text-xs app-border app-text-muted">
          <li>
            <b>Flow:</b> Recruiter sends the file → <b>IT</b> confirms the corporate email → <b>HR</b> completes its fields →{" "}
            <b>PM / Lead</b> confirms the entry.
          </li>
          <li>
            Talent and Owner get an informational notice when the file is sent and when it is complete (Content is notified
            by email once the backend is connected).
          </li>
          <li>
            Only people who moved to Hired after the ATS started appear here. Hires imported from the old database do not.
          </li>
        </ul>
      </div>

      {fileFor && (
        <OnboardingFileDialog
          title={`Onboarding file · ${
            fileFor.record ? `${fileFor.record.file.firstName} ${fileFor.record.file.lastName}` : fileFor.hire?.candidate.name
          }`}
          initial={fileFor.record ? fileFor.record.file : prefill(fileFor.hire as PendingHire)}
          projectName={fileFor.record ? fileFor.record.projectName : (fileFor.hire as PendingHire).project.projectName}
          projects={projectNames}
          referents={referents}
          isNew={!fileFor.record}
          onClose={() => setFileFor(null)}
          onSave={handleFile}
        />
      )}

      {stepFor && (
        <OnboardingStepDialog
          record={stepFor.record}
          step={stepFor.step}
          onClose={() => setStepFor(null)}
          onConfirm={handleStep}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
