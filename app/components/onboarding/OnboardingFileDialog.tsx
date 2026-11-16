"use client";

import { useMemo, useState } from "react";

import { ENGLISH_LEVELS } from "@/app/lib/englishLevels";
import {
  ENTRY_TYPES,
  salaryInWords,
  suggestCorporateEmail,
  type EntryType,
  type OnboardingFile,
} from "@/app/lib/onboarding";
import { CORPORATE_EMAIL_DOMAIN, type AppUser } from "@/app/lib/userDirectory";
import { DialogFrame, FIELD_CLASS } from "../resource-planning/DialogFrame";

const SENIORITIES = ["Junior", "Semi Senior", "Senior", "Lead"];
const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const MARITAL = ["Single", "Married", "Other"];

function Field({
  label,
  required = true,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-semibold app-text-secondary">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
      <span className="mt-1 block font-normal">{children}</span>
    </label>
  );
}

function Section({ title }: { title: string }) {
  return (
    <p className="col-span-full mt-3 text-[11px] font-extrabold uppercase tracking-wide text-violet-500">{title}</p>
  );
}

export function emptyFile(initial: Partial<OnboardingFile>): OnboardingFile {
  return {
    entry: "Project",
    ref: "",
    projectEntryDate: "",
    firstName: "",
    lastName: "",
    email: "",
    designation: "",
    department: "",
    location: "",
    source: "",
    salary: "",
    salaryText: "",
    english: "",
    seniority: "Senior",
    zohoRole: "Team Member",
    joining: "",
    employment: "On Contract",
    birth: "",
    gender: "",
    marital: "",
    citizenship: "",
    dni: "",
    personalEmail: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    mobile: "",
    linkedin: "",
    portfolio: "",
    ...initial,
  };
}

/** Ficha de onboarding: los campos "Recruiter" del template de Trick. */
export function OnboardingFileDialog({
  title,
  initial,
  projectName,
  projects,
  referents,
  isNew,
  onClose,
  onSave,
}: {
  title: string;
  initial: OnboardingFile;
  projectName: string;
  projects: string[];
  referents: AppUser[];
  isNew: boolean;
  onClose: () => void;
  onSave: (file: OnboardingFile, projectName: string) => void;
}) {
  const [file, setFile] = useState<OnboardingFile>(initial);
  const [project, setProject] = useState(projectName);
  const [error, setError] = useState("");

  const set = <K extends keyof OnboardingFile>(key: K, value: OnboardingFile[K]) =>
    setFile((current) => ({ ...current, [key]: value }));

  const input = (key: keyof OnboardingFile, type = "text", placeholder?: string) => (
    <input
      type={type}
      value={file[key]}
      placeholder={placeholder}
      onChange={(event) => set(key, event.target.value as never)}
      className={FIELD_CLASS}
    />
  );

  const suggestion = useMemo(
    () => suggestCorporateEmail(file.firstName, file.lastName, CORPORATE_EMAIL_DOMAIN),
    [file.firstName, file.lastName]
  );
  const bench = file.entry === "Bench";
  const words = salaryInWords(file.salary);

  const submit = () => {
    const required: Array<keyof OnboardingFile> = [
      "firstName", "lastName", "email", "designation", "department", "location", "source", "salary",
      "english", "joining", "birth", "gender", "marital", "citizenship", "dni", "personalEmail",
      "address", "city", "state", "country", "zip", "mobile", "linkedin",
    ];

    if (required.some((key) => !String(file[key]).trim())) {
      setError("Complete the required fields (*).");

      return;
    }

    if (!file.email.trim().toLowerCase().endsWith(`@${CORPORATE_EMAIL_DOMAIN}`)) {
      setError(`Email address: use the @${CORPORATE_EMAIL_DOMAIN} format.`);

      return;
    }

    if (!/^\d+$/.test(file.salary.trim())) {
      setError("Salary USD: only numbers, without characters.");

      return;
    }

    if (!bench && (!file.ref || !project || project === "Bench")) {
      setError('Project and "Introduce to" are required unless the person is on Bench.');

      return;
    }

    setError("");
    onSave(
      { ...file, salary: file.salary.trim(), salaryText: words, ref: bench ? "" : file.ref },
      bench ? "Bench" : project
    );
  };

  return (
    <DialogFrame
      title={title}
      subtitle="Recruiter fields of the Trick template. Everything marked * is required."
      confirmLabel={isNew ? "Send file" : "Save changes"}
      wide
      onClose={onClose}
      onConfirm={submit}
    >
      <div className="grid max-h-[62vh] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
        <Section title="Entry" />
        <Field label="Project entry">
          <select
            value={file.entry}
            onChange={(event) => set("entry", event.target.value as EntryType)}
            className={FIELD_CLASS}
          >
            {ENTRY_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Project" required={!bench}>
          <select
            value={project}
            disabled={bench}
            onChange={(event) => setProject(event.target.value)}
            className={FIELD_CLASS}
          >
            {!projects.includes(project) && <option>{project}</option>}
            {projects.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Introduce to (PM / Lead)" required={!bench}>
          <select
            value={file.ref}
            disabled={bench}
            onChange={(event) => set("ref", event.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">Select…</option>
            {referents.map((user) => (
              <option key={user.name}>{user.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Project entry date" required={false}>
          {input("projectEntryDate", "date")}
        </Field>

        <Section title="Job" />
        <Field label="First name">{input("firstName")}</Field>
        <Field label="Last name">{input("lastName")}</Field>
        <Field label={`Email address (@${CORPORATE_EMAIL_DOMAIN}, IT confirms)`}>
          <input
            value={file.email}
            placeholder={suggestion}
            onChange={(event) => set("email", event.target.value)}
            onFocus={() => !file.email && suggestion && set("email", suggestion)}
            className={FIELD_CLASS}
          />
        </Field>
        <Field label="Designation">{input("designation")}</Field>
        <Field label="Department">{input("department")}</Field>
        <Field label="Location">{input("location")}</Field>
        <Field label="Source of hire">{input("source")}</Field>
        <Field label="Salary USD (only number)">{input("salary", "number")}</Field>
        <Field label="Salary text (generated)" required={false}>
          <input value={words} readOnly className={`${FIELD_CLASS} opacity-70`} />
        </Field>
        <Field label="English level">
          <select value={file.english} onChange={(event) => set("english", event.target.value)} className={FIELD_CLASS}>
            <option value="">Select…</option>
            {ENGLISH_LEVELS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Seniority">
          <select value={file.seniority} onChange={(event) => set("seniority", event.target.value)} className={FIELD_CLASS}>
            {SENIORITIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Zoho role (Manager for PM / Producer)">
          <select
            value={file.zohoRole}
            onChange={(event) => set("zohoRole", event.target.value as OnboardingFile["zohoRole"])}
            className={FIELD_CLASS}
          >
            <option>Team Member</option>
            <option>Manager</option>
          </select>
        </Field>
        <Field label="Date of joining">{input("joining", "date")}</Field>
        <Field label="Employment type">{input("employment")}</Field>

        <Section title="Personal" />
        <Field label="Date of birth">{input("birth", "date")}</Field>
        <Field label="Gender">
          <select value={file.gender} onChange={(event) => set("gender", event.target.value)} className={FIELD_CLASS}>
            <option value="">Select…</option>
            {GENDERS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Marital status">
          <select value={file.marital} onChange={(event) => set("marital", event.target.value)} className={FIELD_CLASS}>
            <option value="">Select…</option>
            {MARITAL.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Field>
        <Field label="Citizenship">{input("citizenship")}</Field>
        <Field label="DNI">{input("dni")}</Field>
        <Field label="Personal email address">{input("personalEmail", "email")}</Field>
        <Field label="Address (street and number)">{input("address")}</Field>
        <Field label="City">{input("city")}</Field>
        <Field label="State or province">{input("state")}</Field>
        <Field label="Country">{input("country")}</Field>
        <Field label="Postal code">{input("zip")}</Field>
        <Field label="Personal mobile (country code-number)">{input("mobile", "text", "54-1155550000")}</Field>
        <Field label="LinkedIn profile">{input("linkedin")}</Field>
        <Field label="Portfolio" required={false}>
          {input("portfolio")}
        </Field>
      </div>

      <p className="mt-2 text-xs app-text-muted">
        Dates are shown as dd-MMM-yyyy (for example 01-JAN-2024). The salary in words is generated by the system.
      </p>

      {error && <p className="mt-2 rounded-xl border border-red-500/40 px-3 py-2 text-xs text-red-500">{error}</p>}
    </DialogFrame>
  );
}
