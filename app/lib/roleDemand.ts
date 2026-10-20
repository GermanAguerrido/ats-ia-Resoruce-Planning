import type { ProjectColumn } from "@/app/data/resourcePlanningMock";
import { bandIndex, roleKey, SENIORITY_BANDS } from "./roles";

import { DEFAULT_COVERAGE_RATIO } from "./sourcingRule";

// Cuántas personas queremos tener por cada puesto abierto para sentirnos cubiertos (por defecto)
export const COVERAGE_RATIO = DEFAULT_COVERAGE_RATIO;

export type OpenDemand = {
  positionId: string;
  title: string;
  clientName: string;
  seniority: string;
  quantity: number;
  // Personas de la base con ese rol y seniority igual o mayor
  supply: number;
  covered: boolean;
};

export type RoleDemand = {
  key: string;
  role: string;
  total: number;
  // Cantidad de personas por banda (Junior, Semi Senior, Senior, Lead)
  byBand: number[];
  open: OpenDemand[];
  gap: boolean;
};

export type DemandPerson = { role: string; seniority: string };

/**
 * Qué tenemos y qué nos falta por rol: personas por seniority frente a las posiciones abiertas.
 * Un rol con puestos abiertos y pocas personas con el seniority pedido queda marcado como "Gap".
 */
export function buildRoleDemand(
  people: DemandPerson[],
  projects: ProjectColumn[],
  ratio: number = COVERAGE_RATIO
): RoleDemand[] {
  const roles = new Map<string, RoleDemand>();
  const spelling = new Map<string, Map<string, number>>();

  const ensure = (name: string) => {
    const key = roleKey(name);

    if (!key) {
      return null;
    }

    if (!roles.has(key)) {
      roles.set(key, {
        key,
        role: name,
        total: 0,
        byBand: SENIORITY_BANDS.map(() => 0),
        open: [],
        gap: false,
      });
    }

    return roles.get(key) as RoleDemand;
  };

  people.forEach((person) => {
    const entry = ensure(person.role);

    if (!entry) {
      return;
    }

    entry.total += 1;

    const band = bandIndex(person.seniority);

    if (band >= 0) {
      entry.byBand[band] += 1;
    }

    // El nombre que se muestra es la forma más usada
    const counts = spelling.get(entry.key) ?? new Map<string, number>();

    counts.set(person.role, (counts.get(person.role) ?? 0) + 1);
    spelling.set(entry.key, counts);
  });

  spelling.forEach((counts, key) => {
    const best = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    const entry = roles.get(key);

    if (entry && best) {
      entry.role = best[0];
    }
  });

  projects.forEach((project) =>
    project.positions
      .filter((position) => position.status === "open")
      .forEach((position) => {
        const entry = ensure(position.title);

        if (!entry) {
          return;
        }

        const needed = bandIndex(position.seniority);
        const quantity = position.quantity ?? 1;
        const supply = entry.byBand.reduce(
          (sum, count, index) => (needed < 0 || index >= needed ? sum + count : sum),
          0
        );

        entry.open.push({
          positionId: position.id,
          title: position.title,
          clientName: project.clientName,
          seniority: position.seniority,
          quantity,
          supply,
          covered: supply >= quantity * ratio,
        });
      })
  );

  const list = Array.from(roles.values());

  list.forEach((entry) => {
    entry.gap = entry.open.some((item) => !item.covered);
  });

  // Primero los roles con faltante, después los de más personas
  return list.sort(
    (a, b) => Number(b.gap) - Number(a.gap) || b.total - a.total || a.role.localeCompare(b.role)
  );
}
