"use client";

import { useMemo } from "react";
import { BudgetPanel } from "../components/candidates/BudgetPanel";
import { TalentPageShell } from "../components/candidates/TalentPageShell";
import { useBoardState } from "../hooks/useBoardState";
import { useBudgetConfig } from "../lib/candidateBudget";
import { buildCandidateRows, isInternalRow, rowSeniority } from "../lib/candidateRows";
import { buildRoleDemand } from "../lib/roleDemand";

export default function BudgetPage() {
  const board = useBoardState();
  const { config, setConfig } = useBudgetConfig();

  const roles = useMemo(() => {
    const rows = buildCandidateRows(board.orderedProjects).filter((row) => !isInternalRow(row));

    return buildRoleDemand(
      rows.map((row) => ({ role: row.main.role, seniority: rowSeniority(row) })),
      board.orderedProjects
    ).map((item) => item.role);
  }, [board.orderedProjects]);

  const clients = useMemo(
    () => Array.from(new Set(board.orderedProjects.map((project) => project.clientName))).sort(),
    [board.orderedProjects]
  );

  if (!board.isLoaded) {
    return <div className="min-h-screen app-bg" />;
  }

  return (
    <TalentPageShell
      title="Budget"
      subtitle="Budget by role and seniority, negotiable margin and minimum English. It colors the expected salary in Candidates."
    >
      <BudgetPanel config={config} onChange={setConfig} knownRoles={roles} clients={clients} />
    </TalentPageShell>
  );
}
