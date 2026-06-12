"use client";

import { useState, useMemo } from "react";
import { candidates as initialCandidates } from "../data/candidates";
import type { Candidate } from "../types/candidate";

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

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [countryFilter, setCountryFilter] = useState("All countries");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [recruiterSeniorityFilter, setRecruiterSeniorityFilter] = useState("All seniorities");
  const [technicalSeniorityFilter, setTechnicalSeniorityFilter] = useState(
    "All technical seniorities"
  );
  const [englishFilter, setEnglishFilter] = useState("All english levels");
  const [recruiterFilter, setRecruiterFilter] = useState("All recruiters");
  const [advancedKeyword, setAdvancedKeyword] = useState("");

  const filterOptions = useMemo(() => {
    const statuses = uniqueSorted(candidates.map((c) => c.status));
    const countries = uniqueSorted(candidates.map((c) => c.country));
    const roles = uniqueSorted(candidates.map((c) => c.designation || c.role));
    const recruiterSeniorities = uniqueSorted(
      candidates.map((c) => c.recruiterSeniority || c.seniority)
    );
    const technicalSeniorities = uniqueSorted(
      candidates.map((c) => c.technicalSeniority || "Pending")
    );
    const englishLevels = uniqueSorted(candidates.map((c) => c.english));
    const recruiters = uniqueSorted(candidates.map((c) => c.recruiter));

    return {
      statuses: ["All statuses", ...statuses],
      countries: ["All countries", ...countries],
      roles: ["All roles", ...roles],
      recruiterSeniorities: ["All seniorities", ...recruiterSeniorities],
      technicalSeniorities: ["All technical seniorities", ...technicalSeniorities],
      englishLevels: ["All english levels", ...englishLevels],
      recruiters: ["All recruiters", ...recruiters],
    };
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    let results = [...candidates];

    if (statusFilter !== "All statuses") {
      results = results.filter((c) => c.status === statusFilter);
    }
    if (countryFilter !== "All countries") {
      results = results.filter((c) => c.country === countryFilter);
    }
    if (roleFilter !== "All roles") {
      results = results.filter((c) => c.role === roleFilter || c.designation === roleFilter);
    }
    if (recruiterSeniorityFilter !== "All seniorities") {
      results = results.filter(
        (c) => c.recruiterSeniority === recruiterSeniorityFilter || c.seniority === recruiterSeniorityFilter
      );
    }
    if (technicalSeniorityFilter !== "All technical seniorities") {
      results = results.filter(
        (c) => (c.technicalSeniority || "Pending") === technicalSeniorityFilter
      );
    }
    if (englishFilter !== "All english levels") {
      results = results.filter((c) => c.english === englishFilter);
    }
    if (recruiterFilter !== "All recruiters") {
      results = results.filter((c) => c.recruiter === recruiterFilter);
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
          candidate.salary,
          candidate.currentSalary,
          candidate.expectedSalary,
          candidate.salaryCurrency,
          candidate.salaryMode,
          candidate.salaryNotes,
          candidate.recruiterConclusion,
          candidate.note,
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

  const addCandidate = (candidate: Candidate) => {
    setCandidates((prev) => [candidate, ...prev]);
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const getCandidateById = (id: string) => candidates.find((c) => c.id === id);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All statuses");
    setCountryFilter("All countries");
    setRoleFilter("All roles");
    setRecruiterSeniorityFilter("All seniorities");
    setTechnicalSeniorityFilter("All technical seniorities");
    setEnglishFilter("All english levels");
    setRecruiterFilter("All recruiters");
    setAdvancedKeyword("");
  };

  return {
    candidates,
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
    addCandidate,
    updateCandidate,
    deleteCandidate,
    getCandidateById,
    clearFilters,
  };
}
