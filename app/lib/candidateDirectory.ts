import type { CandidateMini, ProjectColumn } from "@/app/data/resourcePlanningMock";

export type DirectoryCandidate = {
  candidate: CandidateMini;
  // Dónde está hoy este candidato (proyecto · posición)
  positions: Array<{ positionId: string; label: string }>;
};

/** Candidatos únicos (por id) de todo el tablero, con las posiciones donde ya están. */
export function buildCandidateDirectory(
  projects: ProjectColumn[]
): DirectoryCandidate[] {
  const byId = new Map<string, DirectoryCandidate>();

  projects.forEach((project) =>
    project.positions.forEach((position) =>
      position.candidates.forEach((candidate) => {
        const entry = byId.get(candidate.id) ?? { candidate, positions: [] };

        entry.positions.push({
          positionId: position.id,
          label: `${project.projectName} · ${position.title}`,
        });

        byId.set(candidate.id, entry);
      })
    )
  );

  return Array.from(byId.values()).sort((a, b) =>
    a.candidate.name.localeCompare(b.candidate.name)
  );
}