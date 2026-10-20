// Niveles de inglés, de menor a mayor. El orden define el ranking (para ordenar y comparar).
export const ENGLISH_LEVELS = [
    "Basic",
    "Basic / Intermediate",
    "Intermediate",
    "Intermediate / Advanced",
    "Advanced",
    "Advanced / Native",
    "Native",
  ];
  
  // Valores viejos o escritos a mano que se equiparan a un nivel de la lista
  const LEGACY_ALIASES: Record<string, string> = {
    "upper-intermediate": "Intermediate / Advanced",
    "upper intermediate": "Intermediate / Advanced",
    fluent: "Advanced / Native",
    "fluent / native": "Advanced / Native",
    bilingual: "Native",
  };
  
  /** Posición del nivel en la lista (-1 si no hay dato o no se reconoce). */
  export function englishRank(value?: string): number {
    if (!value) {
      return -1;
    }
  
    const normalized = value.trim().toLowerCase();
    const exact = ENGLISH_LEVELS.findIndex((level) => level.toLowerCase() === normalized);
  
    if (exact >= 0) {
      return exact;
    }
  
    const alias = LEGACY_ALIASES[normalized];
  
    return alias ? ENGLISH_LEVELS.indexOf(alias) : -1;
  }
  