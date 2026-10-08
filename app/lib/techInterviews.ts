"use client";

import { useCallback, useEffect, useState } from "react";

export type TechInterviewOpinion = {
  interviewer: string;
  text: string;
};

export type TechInterview = {
  id: string;
  // AAAA-MM-DD
  date: string;
  // Nivel que dio la entrevista
  seniority: string;
  // Conclusiones de cada entrevistador técnico (puede haber más de uno)
  opinions: TechInterviewOpinion[];
  // Evaluación técnica generada a partir de la transcripción (opcional)
  aiEvaluation?: string;
  // Nombres de archivos adjuntos (grabación, transcripción, evaluación)
  attachments: string[];
  // Para qué posición se hizo (informativo: la entrevista sirve para todas)
  context?: string;
  createdBy: string;
  createdAt: string;
};

const EVENT_NAME = "rp-tech-interviews";

// La entrevista técnica es del candidato, no de la posición: se comparte entre posiciones.
const keyOf = (candidateId: string) => `rp-tech:candidate:${candidateId}`;

export function readTechInterviews(candidateId: string): TechInterview[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(keyOf(candidateId));
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as TechInterview[]) : [];
  } catch {
    return [];
  }
}

function writeTechInterviews(candidateId: string, list: TechInterview[]) {
  try {
    window.localStorage.setItem(keyOf(candidateId), JSON.stringify(list));
  } catch {
    // Local storage can fail in private browsing or quota situations.
  }

  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: candidateId }));
}

/** Guarda una entrevista técnica y devuelve la lista actualizada (la más nueva primero). */
export function addTechInterview(candidateId: string, interview: TechInterview) {
  const next = [interview, ...readTechInterviews(candidateId)].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  writeTechInterviews(candidateId, next);

  return next;
}

export function removeTechInterview(candidateId: string, interviewId: string) {
  writeTechInterviews(
    candidateId,
    readTechInterviews(candidateId).filter((item) => item.id !== interviewId)
  );
}

export function makeTechInterviewId() {
  return `tech-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function useTechInterviews(candidateId: string) {
  const [list, setList] = useState<TechInterview[]>(() => readTechInterviews(candidateId));

  const reload = useCallback(() => setList(readTechInterviews(candidateId)), [candidateId]);

  useEffect(() => {
    reload();

    const onChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;

      if (!detail || detail === candidateId) {
        reload();
      }
    };

    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", reload);

    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", reload);
    };
  }, [candidateId, reload]);

  return list;
}

/** Resumen de una línea para mostrar en listas y comentarios. */
export function summarizeTechInterview(interview: TechInterview) {
  const names = interview.opinions
    .map((opinion) => opinion.interviewer)
    .filter(Boolean)
    .join(", ");

  return `${interview.date} · ${interview.seniority}${names ? ` · ${names}` : ""}`;
}
