"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  NewCandidatePayload,
  NewPositionPayload,
  NewProjectPayload,
} from "@/app/components/resource-planning/CreateEntityModal";
import {
  resourcePlanningMock,
  type CandidateMini,
  type PositionCard,
  type ProjectColumn,
} from "@/app/data/resourcePlanningMock";
import {
  clearStoredBoard,
  readStoredBoard,
  writeStoredBoard,
  type BoardOrderMode,
} from "@/app/lib/boardStorage";

export type ProjectDropSide = "before" | "after";

const projectStatusRank: Record<ProjectColumn["status"], number> = {
  active_search: 0,
  coming_soon: 1,
  active_no_search: 2,
  inactive: 3,
};

const priorityRank: Record<ProjectColumn["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function optionalText(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

// Portada generada automáticamente para proyectos nuevos (degradé según el nombre)
function buildCoverImage(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 360;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hash},70%,45%)"/><stop offset="1" stop-color="hsl(${(hash + 60) % 360},60%,25%)"/></linearGradient></defs><rect width="800" height="400" fill="url(#g)"/></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Fuente única de datos de Resource Planning.
 * La usan el tablero (/jobs), el listado de candidatos (/candidates) y,
 * a través del almacenamiento, el dashboard. Cuando exista el backend,
 * solo hay que cambiar la implementación de este archivo.
 */
export function useBoardState() {
  const [projectColumns, setProjectColumns] =
    useState<ProjectColumn[]>(resourcePlanningMock);
  const [orderMode, setOrderMode] = useState<BoardOrderMode>("auto");
  const [manualOrder, setManualOrder] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar el estado guardado del tablero (orden, archivados, movimientos, altas)
  useEffect(() => {
    const stored = readStoredBoard();

    if (stored) {
      setProjectColumns(stored.projects);
      setOrderMode(stored.orderMode);
      setManualOrder(stored.manualOrder);
      setArchivedIds(stored.archivedIds);
    }

    setIsLoaded(true);
  }, []);

  // Guardar el estado del tablero cada vez que cambia
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    writeStoredBoard({
      projects: projectColumns,
      orderMode,
      manualOrder,
      archivedIds,
    });
  }, [isLoaded, projectColumns, orderMode, manualOrder, archivedIds]);

  // Proyectos no archivados, en el orden elegido
  const orderedProjects = useMemo(() => {
    const activeProjects = projectColumns.filter(
      (project) => !archivedIds.includes(project.id)
    );

    if (orderMode === "manual") {
      const positions = new Map<string, number>(
        manualOrder.map((id, index): [string, number] => [id, index])
      );

      return [...activeProjects].sort(
        (a, b) =>
          (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER)
      );
    }

    return [...activeProjects].sort(
      (a, b) =>
        projectStatusRank[a.status] - projectStatusRank[b.status] ||
        priorityRank[a.priority] - priorityRank[b.priority]
    );
  }, [projectColumns, archivedIds, orderMode, manualOrder]);

  const archivedProjects = projectColumns.filter((project) =>
    archivedIds.includes(project.id)
  );

  // ---- Ediciones ----
  const updateProject = (projectId: string, updates: Partial<ProjectColumn>) => {
    setProjectColumns((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, ...updates } : project
      )
    );
  };

  const updatePosition = (positionId: string, updates: Partial<PositionCard>) => {
    setProjectColumns((current) =>
      current.map((project) => ({
        ...project,
        positions: project.positions.map((position) =>
          position.id === positionId ? { ...position, ...updates } : position
        ),
      }))
    );
  };

  const updateCandidate = (
    candidateId: string,
    updates: Partial<CandidateMini>
  ) => {
    setProjectColumns((current) =>
      current.map((project) => ({
        ...project,
        positions: project.positions.map((position) => ({
          ...position,
          candidates: position.candidates.map((candidate) =>
            candidate.id === candidateId ? { ...candidate, ...updates } : candidate
          ),
        })),
      }))
    );
  };

  // ---- Altas ----
  const createProject = (payload: NewProjectPayload) => {
    const id = `project-${makeId()}`;

    const project: ProjectColumn = {
      id,
      clientName: payload.clientName,
      projectName: payload.projectName,
      status: payload.status,
      priority: payload.priority,
      confidential: payload.confidential,
      cover: buildCoverImage(`${payload.clientName} ${payload.projectName}`),
      description: payload.description,
      positions: [],
    };

    setProjectColumns((current) => [...current, project]);

    if (orderMode === "manual") {
      setManualOrder((current) => [...current, id]);
    }
  };

  const createPosition = (projectId: string, payload: NewPositionPayload) => {
    const id = `position-${makeId()}`;

    const position: PositionCard = {
      id,
      title: payload.title,
      seniority: payload.seniority,
      status: payload.status,
      owner: payload.owner,
      quantity: payload.quantity,
      candidates: [],
    };

    setProjectColumns((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, positions: [...project.positions, position] }
          : project
      )
    );

    // La JD queda guardada donde la lee el editor de la vista de posición
    if (payload.jd.trim()) {
      try {
        window.localStorage.setItem(
          `rp-jd:project:${projectId}:position:${id}`,
          escapeHtml(payload.jd.trim()).replace(/\n/g, "<br>")
        );
      } catch {
        // Local storage can fail in private browsing or quota situations.
      }
    }
  };

  const createCandidate = (
    projectId: string,
    positionId: string,
    payload: NewCandidatePayload
  ) => {
    const id = `candidate-${makeId()}`;
    const today = new Date().toISOString().slice(0, 10);

    const position = projectColumns
      .find((project) => project.id === projectId)
      ?.positions.find((item) => item.id === positionId);

    const candidate: CandidateMini = {
      id,
      name: payload.name,
      role: payload.role,
      location: payload.location || "Not defined",
      status: [],
      processStatus: payload.processStatus,
      resumeStatus: payload.resumeStatus,
      talentType: payload.talentType,
      email: optionalText(payload.email),
      linkedin: optionalText(payload.linkedin),
      portfolio: optionalText(payload.portfolio),
      salaryCurrent: optionalText(payload.salaryCurrent),
      salaryExpected: optionalText(payload.salaryExpected),
      workRelation: optionalText(payload.workRelation),
      englishLevel: optionalText(payload.englishLevel),
      source: optionalText(payload.source),
      notes: optionalText(payload.notes),
      recruiterOwner: payload.recruiterOwner,
      lastContactAt: today,
      daysInProcess: 0,
      timeline: [
        {
          id: `timeline-${id}`,
          title: "Candidate added",
          description: position
            ? `Added to ${position.title} · ${position.seniority}.`
            : "Added to the process.",
          date: today,
          author: payload.recruiterOwner,
        },
      ],
    };

    setProjectColumns((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              positions: project.positions.map((item) =>
                item.id === positionId
                  ? { ...item, candidates: [...item.candidates, candidate] }
                  : item
              ),
            }
          : project
      )
    );
  };

  // ---- Archivar / restaurar ----
  const archiveProject = (projectId: string) => {
    setArchivedIds((current) =>
      current.includes(projectId) ? current : [...current, projectId]
    );
  };

  const restoreProject = (projectId: string) => {
    setArchivedIds((current) => current.filter((id) => id !== projectId));
  };

  // ---- Orden y movimientos ----
  const moveProject = (
    sourceId: string,
    targetId: string,
    side: ProjectDropSide
  ) => {
    const ids = orderedProjects
      .map((project) => project.id)
      .filter((id) => id !== sourceId);
    const targetIndex = ids.indexOf(targetId);

    if (targetIndex < 0) {
      return;
    }

    ids.splice(side === "before" ? targetIndex : targetIndex + 1, 0, sourceId);

    setManualOrder(ids);
    setOrderMode("manual");
  };

  const movePosition = (
    positionId: string,
    fromProjectId: string,
    toProjectId: string,
    beforePositionId: string | null
  ) => {
    if (beforePositionId === positionId) {
      return;
    }

    setProjectColumns((current) => {
      const sourceProject = current.find((project) => project.id === fromProjectId);
      const movedPosition = sourceProject?.positions.find(
        (position) => position.id === positionId
      );

      if (!sourceProject || !movedPosition) {
        return current;
      }

      return current
        .map((project) =>
          project.id === fromProjectId
            ? {
                ...project,
                positions: project.positions.filter(
                  (position) => position.id !== positionId
                ),
              }
            : project
        )
        .map((project) => {
          if (project.id !== toProjectId) {
            return project;
          }

          const nextPositions = [...project.positions];
          const insertIndex = beforePositionId
            ? nextPositions.findIndex((position) => position.id === beforePositionId)
            : -1;

          if (insertIndex >= 0) {
            nextPositions.splice(insertIndex, 0, movedPosition);
          } else {
            nextPositions.push(movedPosition);
          }

          return { ...project, positions: nextPositions };
        });
    });
  };

  const setAutoOrder = () => {
    setOrderMode("auto");
  };

  const resetBoard = () => {
    clearStoredBoard();
    setProjectColumns(resourcePlanningMock);
    setOrderMode("auto");
    setManualOrder([]);
    setArchivedIds([]);
  };

  return {
    isLoaded,
    projectColumns,
    orderedProjects,
    archivedProjects,
    orderMode,
    updateProject,
    updatePosition,
    updateCandidate,
    createProject,
    createPosition,
    createCandidate,
    archiveProject,
    restoreProject,
    moveProject,
    movePosition,
    setAutoOrder,
    resetBoard,
  };
}