"use client";

import { useEffect, useMemo, useState } from "react";
import { AiMatchPanel } from "../components/candidates/AiMatchPanel";
import { TalentPageShell } from "../components/candidates/TalentPageShell";
import { useBoardState } from "../hooks/useBoardState";
import { useBudgetConfig } from "../lib/candidateBudget";
import { buildCandidateRows } from "../lib/candidateRows";
import { buildNotesIndex } from "../lib/candidateSearch";

export default function AiMatchPage() {
  const board = useBoardState();
  const { config: budget } = useBudgetConfig();
  const [notice, setNotice] = useState<string | null>(null);

  const rows = useMemo(() => buildCandidateRows(board.orderedProjects), [board.orderedProjects]);
  const notes = useMemo(() => buildNotesIndex(rows.map((row) => row.main)), [rows]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 4000);

    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!board.isLoaded) {
    return <div className="min-h-screen app-bg" />;
  }

  return (
    <TalentPageShell
      title="AI match"
      subtitle="Match the job description of an open position against the candidate database."
    >
      <AiMatchPanel
        projects={board.orderedProjects}
        rows={rows}
        notes={notes}
        budget={budget}
        onOpen={(link) =>
          window.open(`/candidates?open=${encodeURIComponent(link.candidate.id)}`, "_blank")
        }
        onAddToPosition={(projectId, positionId, candidate) => {
          board.addExistingCandidate(projectId, positionId, candidate);
          setNotice(`${candidate.name} was added to the position as Contacted.`);
        }}
      />

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm text-white shadow-xl">
          {notice}
        </div>
      )}
    </TalentPageShell>
  );
}
