"use client";

import { useMemo, useState } from "react";

import type { NewCandidatePayload } from "@/app/components/resource-planning/CreateEntityModal";
import type { DirectoryCandidate } from "@/app/lib/candidateDirectory";
import { INACTIVITY_DAYS, checkConsultoraLoad, type OpenPosition } from "@/app/lib/consultora";
import { ENGLISH_LEVELS } from "@/app/lib/englishLevels";
import { DialogFrame, FIELD_CLASS, FieldLabel } from "../resource-planning/DialogFrame";

function fmt(date?: string) {
  return date ? new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

/**
 * Carga de un perfil por la consultora. Primero se busca por LinkedIn o mail: si ya está en la base
 * se aplican las reglas de atribución (primer contacto del equipo interno, o 6 meses de inactividad).
 */
export function LoadProfileDialog({
  company,
  openPositions,
  directory,
  onCreate,
  onUpdate,
  onClose,
}: {
  company: string;
  openPositions: OpenPosition[];
  directory: DirectoryCandidate[];
  onCreate: (position: OpenPosition, payload: NewCandidatePayload) => void;
  onUpdate: (entry: DirectoryCandidate, updates: { salaryExpected?: string; email?: string; linkedin?: string }) => void;
  onClose: () => void;
}) {
  const [idValue, setIdValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [positionKey, setPositionKey] = useState("");
  const [location, setLocation] = useState("");
  const [english, setEnglish] = useState("");
  const [salary, setSalary] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [notes, setNotes] = useState("");
  const [cv, setCv] = useState<{ name: string; size: number } | null>(null);

  const typed = idValue.trim();
  const input = typed.includes("@") ? { email: typed } : { linkedin: typed };
  const result = useMemo(
    () => (checked ? checkConsultoraLoad(input, directory, company) : { kind: "empty" as const }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checked, typed, directory, company]
  );

  // Una opción por posición + seniority (la consultora no ve proyectos ni clientes)
  const options = useMemo(() => {
    const map = new Map<string, OpenPosition>();

    openPositions
      .filter((item) => !item.setting.hidden)
      .forEach((item) => {
        const key = `${item.position.title}|${item.position.seniority}`;

        if (!map.has(key)) {
          map.set(key, item);
        }
      });

    return Array.from(map.entries());
  }, [openPositions]);

  const chosen = options.find(([key]) => key === positionKey)?.[1];
  const showForm = result.kind === "new";
  const showUpdate = result.kind === "update";

  const confirm = () => {
    if (result.kind === "update") {
      onUpdate(result.entry, {
        salaryExpected: salary.trim() || undefined,
        email: email.trim() || undefined,
        linkedin: linkedin.trim() || undefined,
      });

      return;
    }

    if (!chosen) {
      return;
    }

    const owner = chosen.position.owner;

    onCreate(chosen, {
      name: name.trim(),
      role: chosen.position.title,
      location: location.trim(),
      englishLevel: english,
      email: email.trim(),
      linkedin: linkedin.trim(),
      portfolio: portfolio.trim(),
      salaryCurrent: "",
      salaryExpected: salary.trim(),
      workRelation: "",
      seniority: chosen.position.seniority,
      recruiterOwner: owner,
      processStatus: "sourced",
      resumeStatus: "none",
      talentType: "external",
      notes: notes.trim(),
      consultora: company,
      cvFile: cv ?? undefined,
    });
  };

  const canConfirm = showUpdate
    ? Boolean(salary.trim() || email.trim() || linkedin.trim())
    : showForm && Boolean(name.trim() && chosen && (email.trim() || linkedin.trim()));

  return (
    <DialogFrame
      title="Load profile"
      subtitle="First check if the person is already in our database."
      confirmLabel={showUpdate ? "Send update" : "Load profile"}
      confirmDisabled={!canConfirm}
      wide
      onClose={onClose}
      onConfirm={confirm}
    >
      <FieldLabel required>LinkedIn or email</FieldLabel>
      <div className="flex gap-2">
        <input
          value={idValue}
          onChange={(event) => {
            setIdValue(event.target.value);
            setChecked(false);
          }}
          placeholder="linkedin.com/in/… or name@mail.com"
          className={FIELD_CLASS}
        />
        <button
          type="button"
          disabled={!typed}
          onClick={() => {
            setChecked(true);

            if (typed.includes("@")) {
              setEmail(typed);
            } else {
              setLinkedin(typed);
            }
          }}
          className="shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold app-border hover:border-violet-500 disabled:opacity-40"
        >
          Check
        </button>
      </div>

      {result.kind === "new" && (
        <p className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs app-text-primary">
          <b>New profile.</b> It is not in our database. You can load it; it counts for {company} from today.
        </p>
      )}

      {result.kind === "own" && (
        <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs app-text-primary">
          <b>Already loaded by {company}</b> on {fmt(result.entry.candidate.consultoraLoadedAt)}. The first load prevails.
        </p>
      )}

      {result.kind === "blocked" && (
        <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs app-text-primary">
          {result.entry.candidate.consultora ? (
            <>
              <b>Already loaded by another consultora</b> on {fmt(result.entry.candidate.consultoraLoadedAt)}. The first load prevails.
            </>
          ) : (
            <>
              <b>Assigned to {result.recruiter ?? "our team"}</b> · last contact {fmt(result.lastActivityAt)}. Our team contacted
              this person first, so it does not count for the consultora, even if you interviewed them.
            </>
          )}
        </p>
      )}

      {result.kind === "update" && (
        <p className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs app-text-primary">
          <b>Assigned to {result.recruiter ?? "our team"}</b> · last contact {fmt(result.lastActivityAt)}. It has been inactive
          for more than {Math.floor(INACTIVITY_DAYS / 30)} months, so you can <b>update</b> the profile (salary expectation,
          contact). Sending the update makes it count for {company}.
        </p>
      )}

      {showUpdate && (
        <>
          <FieldLabel>Salary expectation (USD)</FieldLabel>
          <input value={salary} onChange={(event) => setSalary(event.target.value)} className={FIELD_CLASS} />
          <FieldLabel>Contact email</FieldLabel>
          <input value={email} onChange={(event) => setEmail(event.target.value)} className={FIELD_CLASS} />
          <FieldLabel>LinkedIn</FieldLabel>
          <input value={linkedin} onChange={(event) => setLinkedin(event.target.value)} className={FIELD_CLASS} />
        </>
      )}

      {showForm && (
        <>
          <FieldLabel required>Full name</FieldLabel>
          <input value={name} onChange={(event) => setName(event.target.value)} className={FIELD_CLASS} />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Email</FieldLabel>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className={FIELD_CLASS} />
            </div>
            <div>
              <FieldLabel>LinkedIn</FieldLabel>
              <input value={linkedin} onChange={(event) => setLinkedin(event.target.value)} className={FIELD_CLASS} />
            </div>
          </div>

          <FieldLabel required>Open position</FieldLabel>
          <select value={positionKey} onChange={(event) => setPositionKey(event.target.value)} className={FIELD_CLASS}>
            <option value="">Select a position…</option>
            {options.map(([key, item]) => (
              <option key={key} value={key}>
                {item.position.title} · {item.position.seniority}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Location</FieldLabel>
              <input value={location} onChange={(event) => setLocation(event.target.value)} className={FIELD_CLASS} />
            </div>
            <div>
              <FieldLabel>English level</FieldLabel>
              <select value={english} onChange={(event) => setEnglish(event.target.value)} className={FIELD_CLASS}>
                <option value="">Not defined</option>
                {ENGLISH_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Salary expectation (USD)</FieldLabel>
              <input value={salary} onChange={(event) => setSalary(event.target.value)} className={FIELD_CLASS} />
            </div>
            <div>
              <FieldLabel>Portfolio</FieldLabel>
              <input value={portfolio} onChange={(event) => setPortfolio(event.target.value)} className={FIELD_CLASS} />
            </div>
          </div>

          <FieldLabel>CV (PDF)</FieldLabel>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) => {
              const file = event.target.files?.[0];

              setCv(file ? { name: file.name, size: file.size } : null);
            }}
            className={FIELD_CLASS}
          />

          <FieldLabel>Notes</FieldLabel>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={`${FIELD_CLASS} min-h-[70px] resize-y`}
          />
        </>
      )}
    </DialogFrame>
  );
}
