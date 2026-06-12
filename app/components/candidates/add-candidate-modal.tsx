"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

import type {
  Candidate,
  CandidateSeniority,
  CandidateStatus,
  EnglishLevel,
  SalaryCurrency,
  SalaryMode,
} from "@/app/types/candidate";

type Props = {
  open: boolean;
  onClose: () => void;
  onAddCandidate: (candidate: Candidate) => void;
};

const defaultRoles = [
  "2D Artist",
  "3D Artist",
  "Backend Developer",
  "Content",
  "DevOps",
  "Unity Game Engineer",
  "Unreal Game Engineer",
  "LiveOps",
  "Producer / Project Manager",
  "Product Manager",
  "QA",
  "Technical Artist",
  "UI / UX Designer",
  "UI Designer",
  "UX Designer",
  "Web Developer",
  "Video Editor",
  "Game Designer",
];

const defaultCountries = ["Argentina", "Uruguay", "Brazil"];

const seniorities: CandidateSeniority[] = [
  "Junior",
  "Semi Senior",
  "Senior",
  "Lead",
  "Staff",
  "Principal",
];

const englishLevels: EnglishLevel[] = [
  "Basic",
  "Basic / Intermediate",
  "Intermediate",
  "Intermediate / Advanced",
  "Advanced",
  "Native",
];

const defaultStatuses: CandidateStatus[] = [
  "Applied",
  "HR Interview",
  "Technical Interview",
  "Client Interview",
  "Offered",
  "Hired",
  "Discarded",
];

const recruiters = [
  { name: "Sofía", initials: "SO" },
  { name: "Manu", initials: "MA" },
  { name: "Laura", initials: "LA" },
];

const salaryCurrencies: SalaryCurrency[] = ["USD", "ARS", "BRL", "UYU"];

const salaryModes: SalaryMode[] = ["Exact", "Range", "Not specified"];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AddCandidateModal({
  open,
  onClose,
  onAddCandidate,
}: Props) {
  const [name, setName] = useState("");

  const [role, setRole] = useState("Unity Game Engineer");
  const [customRole, setCustomRole] = useState("");

  const [country, setCountry] = useState("Argentina");
  const [customCountry, setCustomCountry] = useState("");

  const [seniority, setSeniority] =
    useState<CandidateSeniority>("Semi Senior");

  const [yearsExperience, setYearsExperience] = useState("");

  const [english, setEnglish] = useState<EnglishLevel>("Intermediate");

  const [availableStatuses, setAvailableStatuses] =
    useState<string[]>(defaultStatuses);

  const [status, setStatus] = useState<string>("Applied");
  const [customStatus, setCustomStatus] = useState("");

  const [recruiter, setRecruiter] = useState("Sofía");

  const [availability, setAvailability] = useState("Immediate");

  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [salaryMode, setSalaryMode] = useState<SalaryMode>("Not specified");
  const [salaryCurrency, setSalaryCurrency] =
    useState<SalaryCurrency>("USD");

  const [currentSalary, setCurrentSalary] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [salaryNotes, setSalaryNotes] = useState("");

  const [tags, setTags] = useState("Unity, C#, Gameplay");

  const [recruiterConclusion, setRecruiterConclusion] = useState("");

  if (!open) return null;

  const finalRole = role === "Other" ? customRole : role;
  const finalCountry = country === "Other" ? customCountry : country;

  function resetForm() {
    setName("");
    setRole("Unity Game Engineer");
    setCustomRole("");
    setCountry("Argentina");
    setCustomCountry("");
    setSeniority("Semi Senior");
    setYearsExperience("");
    setEnglish("Intermediate");
    setStatus("Applied");
    setCustomStatus("");
    setRecruiter("Sofía");
    setAvailability("Immediate");
    setEmail("");
    setLinkedin("");
    setPortfolio("");
    setSalaryMode("Not specified");
    setSalaryCurrency("USD");
    setCurrentSalary("");
    setExpectedSalary("");
    setSalaryNotes("");
    setTags("Unity, C#, Gameplay");
    setRecruiterConclusion("");
  }

  function addCustomStatus() {
    const cleanStatus = customStatus.trim();

    if (!cleanStatus) return;

    setAvailableStatuses((current) => {
      if (current.includes(cleanStatus)) return current;

      return [...current, cleanStatus];
    });

    setStatus(cleanStatus);
    setCustomStatus("");
  }

  function handleSubmit() {
    if (!name.trim()) return;
    if (!finalRole.trim()) return;
    if (!finalCountry.trim()) return;

    const selectedRecruiter =
      recruiters.find((item) => item.name === recruiter) ?? recruiters[0];

    const cleanTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const salarySummary =
      salaryMode === "Not specified"
        ? "Not specified"
        : `${salaryCurrency} ${
            expectedSalary || currentSalary || "Not specified"
          }`;

    const candidate: Candidate = {
      initials: getInitials(name),
      name,
      role: finalRole,
      designation: finalRole,

      meta: `${finalCountry} • ${
        yearsExperience || "Exp. pending"
      } • ${english} English`,

      country: finalCountry,

      seniority,
      recruiterSeniority: seniority,
      technicalSeniority: undefined,

      yearsExperience,

      english,

      status,

      recruiter: selectedRecruiter.name,
      recruiterInitials: selectedRecruiter.initials,

      match: 0,

      tags: cleanTags,
      updated: "Just now",

      salary: salarySummary,

      currentSalary,
      expectedSalary,
      salaryCurrency,
      salaryMode,
      salaryNotes,

      availability,

      email,
      linkedin,
      portfolio,

      strengths: ["Recently added profile", "Pending recruiter validation"],
      risks: ["Needs screening", "Technical fit not validated yet"],

      note:
        recruiterConclusion ||
        "New candidate added manually. Pending recruiter screening and technical validation.",

      recruiterConclusion,

      timeline: ["Candidate manually added", "Awaiting recruiter review"],
    };

    onAddCandidate(candidate);
    resetForm();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 p-6">
          <div>
            <h3 className="text-xl font-semibold text-white">
              Add candidate
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Create an initial recruiter profile. Technical seniority and JD
              match can be validated later.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.05] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-8">
            <section>
              <h4 className="text-sm font-semibold text-white">
                Candidate basics
              </h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Candidate name
                  </label>

                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Example: Valentina Torres"
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Designation / Role
                  </label>

                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none"
                  >
                    {defaultRoles.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                    <option>Other</option>
                  </select>
                </div>

                {role === "Other" && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      New role
                    </label>

                    <input
                      value={customRole}
                      onChange={(event) => setCustomRole(event.target.value)}
                      placeholder="Example: AI Gameplay Engineer"
                      className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Country
                  </label>

                  <select
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none"
                  >
                    {defaultCountries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                    <option>Other</option>
                  </select>
                </div>

                {country === "Other" && (
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      New country
                    </label>

                    <input
                      value={customCountry}
                      onChange={(event) =>
                        setCustomCountry(event.target.value)
                      }
                      placeholder="Example: Chile"
                      className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Recruiter seniority
                  </label>

                  <select
                    value={seniority}
                    onChange={(event) =>
                      setSeniority(event.target.value as CandidateSeniority)
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none"
                  >
                    {seniorities.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Years of experience
                  </label>

                  <input
                    value={yearsExperience}
                    onChange={(event) =>
                      setYearsExperience(event.target.value)
                    }
                    placeholder="Example: 6y"
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    English
                  </label>

                  <select
                    value={english}
                    onChange={(event) =>
                      setEnglish(event.target.value as EnglishLevel)
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none"
                  >
                    {englishLevels.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Availability
                  </label>

                  <input
                    value={availability}
                    onChange={(event) => setAvailability(event.target.value)}
                    placeholder="Immediate / 15 days / 30 days"
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-white">Contact</h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Email
                  </label>

                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="candidate@email.com"
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    LinkedIn
                  </label>

                  <input
                    value={linkedin}
                    onChange={(event) => setLinkedin(event.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Portfolio
                  </label>

                  <input
                    value={portfolio}
                    onChange={(event) => setPortfolio(event.target.value)}
                    placeholder="Portfolio / GitHub / ArtStation / Website"
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-white">
                Compensation
              </h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Salary mode
                  </label>

                  <select
                    value={salaryMode}
                    onChange={(event) =>
                      setSalaryMode(event.target.value as SalaryMode)
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none"
                  >
                    {salaryModes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Currency
                  </label>

                  <select
                    value={salaryCurrency}
                    onChange={(event) =>
                      setSalaryCurrency(event.target.value as SalaryCurrency)
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none"
                  >
                    {salaryCurrencies.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Current salary
                  </label>

                  <input
                    value={currentSalary}
                    onChange={(event) => setCurrentSalary(event.target.value)}
                    placeholder="Example: 3500 / 3k-4k"
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Expected salary
                  </label>

                  <input
                    value={expectedSalary}
                    onChange={(event) => setExpectedSalary(event.target.value)}
                    placeholder="Example: 4500 / 4k-5k"
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Salary notes
                  </label>

                  <textarea
                    value={salaryNotes}
                    onChange={(event) => setSalaryNotes(event.target.value)}
                    placeholder="Any context about current/expected salary, currency, contractor conditions..."
                    className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </div>
            </section>

            <section>
              <h4 className="text-sm font-semibold text-white">
                Recruiting
              </h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none"
                  >
                    {availableStatuses.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Add custom status
                  </label>

                  <div className="mt-2 flex gap-2">
                    <input
                      value={customStatus}
                      onChange={(event) =>
                        setCustomStatus(event.target.value)
                      }
                      placeholder="Example: Internal Review"
                      className="h-10 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                    />

                    <button
                      type="button"
                      onClick={addCustomStatus}
                      className="rounded-xl border border-white/10 px-3 text-sm text-zinc-300 hover:bg-white/[0.04]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Recruiter
                  </label>

                  <select
                    value={recruiter}
                    onChange={(event) => setRecruiter(event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none"
                  >
                    {recruiters.map((item) => (
                      <option key={item.name}>{item.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Tags
                  </label>

                  <input
                    value={tags}
                    onChange={(event) => setTags(event.target.value)}
                    placeholder="Unity, C#, Multiplayer"
                    className="mt-2 h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Conclusion / recruiter notes
                  </label>

                  <textarea
                    value={recruiterConclusion}
                    onChange={(event) =>
                      setRecruiterConclusion(event.target.value)
                    }
                    placeholder="Recruiter conclusion, motivation, risks, compensation context, links, observations..."
                    className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-white/20 focus:ring-2 focus:ring-white/10"
                  />
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/10 p-6">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/[0.04]"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={
              !name.trim() || !finalRole.trim() || !finalCountry.trim()
            }
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add candidate
          </button>
        </div>
      </div>
    </div>
  );
}