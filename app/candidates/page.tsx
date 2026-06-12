"use client";

import { useMemo, useState } from "react";

import type { Candidate } from "../types/candidate";
import { candidates as initialCandidates } from "../data/candidates";

import { AddCandidateModal } from "../components/candidates/add-candidate-modal";
import { CandidateFilters } from "../components/candidates/candidate-filters";
import { CandidateTable } from "../components/candidates/candidate-table";

function uniqueSorted(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(
      values
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [countryFilter, setCountryFilter] = useState("All countries");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [recruiterSeniorityFilter, setRecruiterSeniorityFilter] =
    useState("All seniorities");
  const [technicalSeniorityFilter, setTechnicalSeniorityFilter] = useState(
    "All technical seniorities"
  );
  const [englishFilter, setEnglishFilter] = useState("All english levels");
  const [recruiterFilter, setRecruiterFilter] = useState("All recruiters");

  const [advancedKeyword, setAdvancedKeyword] = useState("");
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  const [addCandidateOpen, setAddCandidateOpen] = useState(false);

  const filterOptions = useMemo(() => {
    const statuses = uniqueSorted(
      candidates.map((candidate) => candidate.status)
    );

    const countries = uniqueSorted(
      candidates.map((candidate) => candidate.country)
    );

    const roles = uniqueSorted(
      candidates.map((candidate) => candidate.designation || candidate.role)
    );

    const recruiterSeniorities = uniqueSorted(
      candidates.map(
        (candidate) => candidate.recruiterSeniority || candidate.seniority
      )
    );

    const technicalSeniorities = uniqueSorted(
      candidates.map((candidate) => candidate.technicalSeniority || "Pending")
    );

    const englishLevels = uniqueSorted(
      candidates.map((candidate) => candidate.english)
    );

    const recruiters = uniqueSorted(
      candidates.map((candidate) => candidate.recruiter)
    );

    return {
      statusOptions: ["All statuses", ...statuses],
      countryOptions: ["All countries", ...countries],
      roleOptions: ["All roles", ...roles],
      recruiterSeniorityOptions: ["All seniorities", ...recruiterSeniorities],
      technicalSeniorityOptions: [
        "All technical seniorities",
        ...technicalSeniorities,
      ],
      englishOptions: ["All english levels", ...englishLevels],
      recruiterOptions: ["All recruiters", ...recruiters],
    };
  }, [candidates]);

  const activeFiltersCount = [
    statusFilter !== "All statuses",
    countryFilter !== "All countries",
    roleFilter !== "All roles",
    recruiterSeniorityFilter !== "All seniorities",
    technicalSeniorityFilter !== "All technical seniorities",
    englishFilter !== "All english levels",
    recruiterFilter !== "All recruiters",
    search.length > 0,
    advancedKeyword.length > 0,
  ].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setStatusFilter("All statuses");
    setCountryFilter("All countries");
    setRoleFilter("All roles");
    setRecruiterSeniorityFilter("All seniorities");
    setTechnicalSeniorityFilter("All technical seniorities");
    setEnglishFilter("All english levels");
    setRecruiterFilter("All recruiters");
    setAdvancedKeyword("");
    setAdvancedFiltersOpen(false);
  }

  function addCandidate(candidate: Candidate) {
    setCandidates((current) => [candidate, ...current]);
    clearFilters();
  }

  const filteredCandidates = useMemo(() => {
    let results = [...candidates];

    if (statusFilter !== "All statuses") {
      results = results.filter(
        (candidate) => candidate.status === statusFilter
      );
    }

    if (countryFilter !== "All countries") {
      results = results.filter(
        (candidate) => candidate.country === countryFilter
      );
    }

    if (roleFilter !== "All roles") {
      results = results.filter(
        (candidate) =>
          candidate.role === roleFilter || candidate.designation === roleFilter
      );
    }

    if (recruiterSeniorityFilter !== "All seniorities") {
      results = results.filter(
        (candidate) =>
          candidate.recruiterSeniority === recruiterSeniorityFilter ||
          candidate.seniority === recruiterSeniorityFilter
      );
    }

    if (technicalSeniorityFilter !== "All technical seniorities") {
      results = results.filter((candidate) => {
        const technicalSeniority = candidate.technicalSeniority || "Pending";
        return technicalSeniority === technicalSeniorityFilter;
      });
    }

    if (englishFilter !== "All english levels") {
      results = results.filter(
        (candidate) => candidate.english === englishFilter
      );
    }

    if (recruiterFilter !== "All recruiters") {
      results = results.filter(
        (candidate) => candidate.recruiter === recruiterFilter
      );
    }

    const query = search.toLowerCase().trim();

    if (query) {
      results = results.filter((candidate) => {
        const searchableText = [
          candidate.name,
          candidate.role,
          candidate.designation,
          candidate.meta,
          candidate.country,
          candidate.seniority,
          candidate.recruiterSeniority,
          candidate.technicalSeniority,
          candidate.yearsExperience,
          candidate.english,
          candidate.status,
          candidate.recruiter,
          candidate.availability,
          candidate.email,
          candidate.linkedin,
          candidate.portfolio,
          ...candidate.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    const advancedQuery = advancedKeyword.toLowerCase().trim();

    if (advancedQuery) {
      results = results.filter((candidate) => {
        const advancedSearchableText = [
          candidate.name,
          candidate.role,
          candidate.designation,
          candidate.meta,
          candidate.country,
          candidate.seniority,
          candidate.recruiterSeniority,
          candidate.technicalSeniority,
          candidate.yearsExperience,
          candidate.english,
          candidate.status,
          candidate.recruiter,
          candidate.salary,
          candidate.currentSalary,
          candidate.expectedSalary,
          candidate.salaryCurrency,
          candidate.salaryMode,
          candidate.salaryNotes,
          candidate.availability,
          candidate.email,
          candidate.linkedin,
          candidate.portfolio,
          candidate.recruiterConclusion,
          candidate.note,
          ...candidate.tags,
          ...candidate.strengths,
          ...candidate.risks,
          ...candidate.timeline,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return advancedSearchableText.includes(advancedQuery);
      });
    }

    return results;
  }, [
    candidates,
    search,
    statusFilter,
    countryFilter,
    roleFilter,
    recruiterSeniorityFilter,
    technicalSeniorityFilter,
    englishFilter,
    recruiterFilter,
    advancedKeyword,
  ]);

  return (
    <main className="min-h-screen app-bg">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-6 py-6">
        <div className="sticky top-0 z-20 -mx-6 border-b px-6 pb-6 pt-2 backdrop-blur-xl app-bg app-border">
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] app-text-muted">
                  Recruiting Pipeline
                </p>

                <h1 className="mt-2 text-4xl font-semibold tracking-tight app-text-primary">
                  Candidates
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 app-text-secondary">
                  Manage candidates, pipeline stages, recruiters, evaluations
                  and candidate data across active searches.
                </p>
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <div className="rounded-xl border px-4 py-3 app-card">
                  <p className="text-xs app-text-muted">Active searches</p>
                  <p className="mt-1 text-xl font-semibold app-text-primary">
                    12
                  </p>
                </div>

                <div className="rounded-xl border px-4 py-3 app-card">
                  <p className="text-xs app-text-muted">Candidates</p>
                  <p className="mt-1 text-xl font-semibold app-text-primary">
                    {candidates.length}
                  </p>
                </div>

                <div className="rounded-xl border px-4 py-3 app-card">
                  <p className="text-xs app-text-muted">Filtered</p>
                  <p className="mt-1 text-xl font-semibold app-text-primary">
                    {filteredCandidates.length}
                  </p>
                </div>
              </div>
            </div>

            <CandidateFilters
              search={search}
              onSearchChange={setSearch}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              statusOptions={filterOptions.statusOptions}
              countryFilter={countryFilter}
              onCountryFilterChange={setCountryFilter}
              countryOptions={filterOptions.countryOptions}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              roleOptions={filterOptions.roleOptions}
              recruiterSeniorityFilter={recruiterSeniorityFilter}
              onRecruiterSeniorityFilterChange={setRecruiterSeniorityFilter}
              recruiterSeniorityOptions={
                filterOptions.recruiterSeniorityOptions
              }
              technicalSeniorityFilter={technicalSeniorityFilter}
              onTechnicalSeniorityFilterChange={setTechnicalSeniorityFilter}
              technicalSeniorityOptions={
                filterOptions.technicalSeniorityOptions
              }
              englishFilter={englishFilter}
              onEnglishFilterChange={setEnglishFilter}
              englishOptions={filterOptions.englishOptions}
              recruiterFilter={recruiterFilter}
              onRecruiterFilterChange={setRecruiterFilter}
              recruiterOptions={filterOptions.recruiterOptions}
              advancedKeyword={advancedKeyword}
              onAdvancedKeywordChange={setAdvancedKeyword}
              advancedFiltersOpen={advancedFiltersOpen}
              onAdvancedFiltersOpenChange={setAdvancedFiltersOpen}
              activeFiltersCount={activeFiltersCount}
              onClearFilters={clearFilters}
              onOpenAddCandidate={() => setAddCandidateOpen(true)}
            />
          </div>
        </div>

        <CandidateTable candidates={filteredCandidates} />
      </div>

      <AddCandidateModal
        open={addCandidateOpen}
        onClose={() => setAddCandidateOpen(false)}
        onAddCandidate={addCandidate}
      />
    </main>
  );
}