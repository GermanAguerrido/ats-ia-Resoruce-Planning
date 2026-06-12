"use client";

import { Download, Plus, Search, SlidersHorizontal, X } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;

  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  statusOptions: string[];

  countryFilter: string;
  onCountryFilterChange: (value: string) => void;
  countryOptions: string[];

  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  roleOptions: string[];

  recruiterSeniorityFilter: string;
  onRecruiterSeniorityFilterChange: (value: string) => void;
  recruiterSeniorityOptions: string[];

  technicalSeniorityFilter: string;
  onTechnicalSeniorityFilterChange: (value: string) => void;
  technicalSeniorityOptions: string[];

  englishFilter: string;
  onEnglishFilterChange: (value: string) => void;
  englishOptions: string[];

  recruiterFilter: string;
  onRecruiterFilterChange: (value: string) => void;
  recruiterOptions: string[];

  advancedKeyword: string;
  onAdvancedKeywordChange: (value: string) => void;

  advancedFiltersOpen: boolean;
  onAdvancedFiltersOpenChange: (value: boolean) => void;

  activeFiltersCount: number;
  onClearFilters: () => void;

  onOpenAddCandidate: () => void;
};

export function CandidateFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  countryFilter,
  onCountryFilterChange,
  countryOptions,
  roleFilter,
  onRoleFilterChange,
  roleOptions,
  recruiterSeniorityFilter,
  onRecruiterSeniorityFilterChange,
  recruiterSeniorityOptions,
  technicalSeniorityFilter,
  onTechnicalSeniorityFilterChange,
  technicalSeniorityOptions,
  englishFilter,
  onEnglishFilterChange,
  englishOptions,
  recruiterFilter,
  onRecruiterFilterChange,
  recruiterOptions,
  advancedKeyword,
  onAdvancedKeywordChange,
  advancedFiltersOpen,
  onAdvancedFiltersOpenChange,
  activeFiltersCount,
  onClearFilters,
  onOpenAddCandidate,
}: Props) {
  const selectClassName =
    "h-10 rounded-xl border px-3 text-sm outline-none app-input";

  const secondaryButtonClassName =
    "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition app-card app-text-secondary";

  return (
    <div className="rounded-2xl border p-4 shadow-sm app-card">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-3 top-2.5 h-4 w-4 app-text-muted" />

            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by candidate, skill, recruiter or role..."
              className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none app-input"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={secondaryButtonClassName}>
              <Download className="h-4 w-4" />
              Export
            </button>

            <button
              onClick={onOpenAddCandidate}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium app-button-primary"
            >
              <Plus className="h-4 w-4" />
              Add candidate
            </button>
          </div>
        </div>

        <div className="border-t pt-4 app-border">
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
              className={selectClassName}
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <select
              value={countryFilter}
              onChange={(event) => onCountryFilterChange(event.target.value)}
              className={selectClassName}
            >
              {countryOptions.map((country) => (
                <option key={country}>{country}</option>
              ))}
            </select>

            <select
              value={roleFilter}
              onChange={(event) => onRoleFilterChange(event.target.value)}
              className={selectClassName}
            >
              {roleOptions.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>

            <select
              value={recruiterSeniorityFilter}
              onChange={(event) =>
                onRecruiterSeniorityFilterChange(event.target.value)
              }
              className={selectClassName}
            >
              {recruiterSeniorityOptions.map((seniority) => (
                <option key={seniority}>{seniority}</option>
              ))}
            </select>

            <select
              value={technicalSeniorityFilter}
              onChange={(event) =>
                onTechnicalSeniorityFilterChange(event.target.value)
              }
              className={selectClassName}
            >
              {technicalSeniorityOptions.map((seniority) => (
                <option key={seniority}>{seniority}</option>
              ))}
            </select>

            <select
              value={englishFilter}
              onChange={(event) => onEnglishFilterChange(event.target.value)}
              className={selectClassName}
            >
              {englishOptions.map((english) => (
                <option key={english}>{english}</option>
              ))}
            </select>

            <select
              value={recruiterFilter}
              onChange={(event) => onRecruiterFilterChange(event.target.value)}
              className={selectClassName}
            >
              {recruiterOptions.map((recruiter) => (
                <option key={recruiter}>{recruiter}</option>
              ))}
            </select>

            <button
              onClick={() => onAdvancedFiltersOpenChange(!advancedFiltersOpen)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                advancedFiltersOpen || advancedKeyword
                  ? "app-button-primary"
                  : "app-card app-text-secondary"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              More filters
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={onClearFilters}
                className={secondaryButtonClassName}
              >
                <X className="h-4 w-4" />
                Clear {activeFiltersCount}
              </button>
            )}
          </div>

          {advancedFiltersOpen && (
            <div className="mt-4 rounded-2xl border p-4 app-card">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium app-text-primary">
                    Advanced keyword search
                  </p>

                  <p className="mt-1 max-w-2xl text-xs leading-5 app-text-secondary">
                    Search inside recruiter notes, tags, strengths, risks,
                    salary notes, portfolio, LinkedIn, technologies, platforms,
                    consoles or any relevant profile text.
                  </p>
                </div>

                <button
                  onClick={() => onAdvancedKeywordChange("")}
                  className="text-xs app-text-secondary hover:underline"
                >
                  Clear keyword
                </button>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-3 top-2.5 h-4 w-4 app-text-muted" />

                <input
                  value={advancedKeyword}
                  onChange={(event) =>
                    onAdvancedKeywordChange(event.target.value)
                  }
                  placeholder="Example: multiplayer, console, PS5, Unreal, LiveOps, automation..."
                  className="h-10 w-full rounded-xl border pl-9 pr-3 text-sm outline-none app-input"
                />
              </div>

              {advancedKeyword && (
                <p className="mt-3 text-xs app-text-secondary">
                  Filtering candidates containing{" "}
                  <span className="font-medium app-text-primary">
                    “{advancedKeyword}”
                  </span>{" "}
                  in their extended profile.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}