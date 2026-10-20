import type {
    CandidateMini,
    PositionCard,
    ProjectColumn,
  } from "@/app/data/resourcePlanningMock";
  import { isHiredCandidate } from "./candidateStatus";
  import { bandIndex } from "./roles";
  
  export type CandidateLink = {
    project: ProjectColumn;
    position: PositionCard;
    candidate: CandidateMini;
  };
  
  // Una fila por persona; si está en varias posiciones junta todos sus vínculos.
  export type CandidateRow = {
    id: string;
    main: CandidateMini;
    links: CandidateLink[];
  };
  
  export function buildCandidateRows(projects: ProjectColumn[]): CandidateRow[] {
    const byId = new Map<string, CandidateRow>();
  
    projects.forEach((project) =>
      project.positions.forEach((position) =>
        position.candidates.forEach((candidate) => {
          const link: CandidateLink = { project, position, candidate };
          const existing = byId.get(candidate.id);
  
          if (existing) {
            existing.links.push(link);
          } else {
            byId.set(candidate.id, { id: candidate.id, main: candidate, links: [link] });
          }
        })
      )
    );
  
    return Array.from(byId.values());
  }
  
  /** Seniority de la persona; si no lo tiene cargado, el de su primera posición. */
  export function rowSeniority(row: CandidateRow): string {
    return row.main.seniority || row.links[0]?.position.seniority || "";
  }
  
  export function rowSeniorityBand(row: CandidateRow): number {
    return bandIndex(rowSeniority(row));
  }
  
  /** Los contratados pasan a Internal y salen de la base de candidatos. */
  export function isInternalRow(row: CandidateRow) {
    return isHiredCandidate(row.main);
  }
  