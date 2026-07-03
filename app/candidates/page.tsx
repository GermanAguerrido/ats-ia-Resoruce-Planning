"use client";

import { useState } from "react";

import type { Candidate } from "../types/candidate";

import { AddCandidateModal } from "../components/candidates/add-candidate-modal";
import { CandidateFilters } from "../components/candidates/candidate-filters";
import { CandidateTable } from "../components/candidates/candidate-table";
import { useCandidates } from "../hooks/useCandidates";

export default function CandidatesPage() {
  const {
    filteredCandidates,
    filterOptions,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    countryFilter,
    setCountryFilter,
    roleFilter,
    setRoleFilter,
    recruiterSeniorityFilter,
    setRecruiterSeniorityFilter,
    technicalSeniorityFilter,
    setTechnicalSeniorityFilter,
    englishFilter,
    setEnglishFilter,
    recruiterFilter,
    setRecruiterFilter,
    advancedKeyword,
    setAdvancedKeyword,
    candidates,
    addCandidate,
    clearFilters,
  } = useCandidates();

  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);

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

  function handleAddCandidate(candidate: Candidate) {
    addCandidate(candidate);
    clearFilters();
  }

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
                  Manage candidates, pipeline stages, recruiters, evaluations and candidate
                  data across active searches.
                </p>
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <div className="rounded-xl border px-4 py-3 app-card">
                  <p className="text-xs app-text-muted">Active searches</p>
                  <p className="mt-1 text-xl font-semibold app-text-primary">12</p>
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
              statusOptions={filterOptions.statuses}
              countryFilter={countryFilter}
              onCountryFilterChange={setCountryFilter}
              countryOptions={filterOptions.countries}
              roleFilter={roleFilter}
              onRoleFilterChange={setRoleFilter}
              roleOptions={filterOptions.roles}
              recruiterSeniorityFilter={recruiterSeniorityFilter}
              onRecruiterSeniorityFilterChange={setRecruiterSeniorityFilter}
              recruiterSeniorityOptions={filterOptions.recruiterSeniorities}
              technicalSeniorityFilter={technicalSeniorityFilter}
              onTechnicalSeniorityFilterChange={setTechnicalSeniorityFilter}
              technicalSeniorityOptions={filterOptions.technicalSeniorities}
              englishFilter={englishFilter}
              onEnglishFilterChange={setEnglishFilter}
              englishOptions={filterOptions.englishLevels}
              recruiterFilter={recruiterFilter}
              onRecruiterFilterChange={setRecruiterFilter}
              recruiterOptions={filterOptions.recruiters}
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
        onAddCandidate={handleAddCandidate}
      />
    </main>
  );
}
