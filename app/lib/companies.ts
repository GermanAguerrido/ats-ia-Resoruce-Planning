// Empresas competidoras: sus ex empleados se marcan en la base y en los informes de mercado.
// Para sumar una, agregarla a esta lista.
export const COMPETITOR_COMPANIES = ["Termax", "Starforge", "Nova Studio"];

export function isCompetitor(company: string): boolean {
  const normalized = company.trim().toLowerCase();

  return COMPETITOR_COMPANIES.some((item) => item.toLowerCase() === normalized);
}

/** Agrega una empresa sin repetirla (sin distinguir mayúsculas). */
export function addCompany(list: string[] | undefined, company: string): string[] {
  const clean = company.trim();
  const current = list ?? [];

  if (!clean || current.some((item) => item.toLowerCase() === clean.toLowerCase())) {
    return current;
  }

  return [...current, clean];
}
