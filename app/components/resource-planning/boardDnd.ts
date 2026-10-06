export type BoardDragState =
  | { kind: "project"; projectId: string }
  | { kind: "position"; positionId: string; fromProjectId: string };

export type ProjectDropSide = "before" | "after";