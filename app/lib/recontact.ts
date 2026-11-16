import type { CandidateMini } from "@/app/data/resourcePlanningMock";

/**
 * ¿Hay un pedido de recontacto abierto? Se cierra solo cuando el recruiter registra un contacto
 * (Log contact) el mismo día del pedido o después. Es la misma regla que usa el To-Do.
 */
export function isRecontactOpen(candidate: CandidateMini) {
  if (!candidate.recontactRequestedAt) {
    return false;
  }

  if (!candidate.lastContactAt) {
    return true;
  }

  return candidate.lastContactAt.slice(0, 10) < candidate.recontactRequestedAt.slice(0, 10);
}

/** Quién puede pedir el recontacto: cualquiera que no sea el owner ni un co-recruiter. */
export function isRecruiterOf(candidate: CandidateMini, user: string) {
  return candidate.recruiterOwner === user || (candidate.coRecruiters ?? []).includes(user);
}
