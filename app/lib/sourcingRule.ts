"use client";

import { useEffect, useState } from "react";

// Regla de sourcing: cuántas personas queremos en la base por cada posición abierta.
export const DEFAULT_COVERAGE_RATIO = 3;
export const COVERAGE_RATIO_OPTIONS = [2, 3, 4, 5];

const RULE_KEY = "ats-ia:resource-planning:sourcing-rule";
const RULE_EVENT = "rp-sourcing-rule";

export function readCoverageRatio(): number {
  if (typeof window === "undefined") {
    return DEFAULT_COVERAGE_RATIO;
  }

  try {
    const raw = window.localStorage.getItem(RULE_KEY);
    const value = raw ? Number(JSON.parse(raw).ratio) : NaN;

    return Number.isFinite(value) && value >= 1 ? value : DEFAULT_COVERAGE_RATIO;
  } catch {
    return DEFAULT_COVERAGE_RATIO;
  }
}

export function useCoverageRatio() {
  const [ratio, setRatioState] = useState(DEFAULT_COVERAGE_RATIO);

  useEffect(() => {
    const sync = () => setRatioState(readCoverageRatio());

    sync();
    window.addEventListener(RULE_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(RULE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setRatio = (next: number) => {
    setRatioState(next);

    try {
      window.localStorage.setItem(RULE_KEY, JSON.stringify({ ratio: next }));
      window.dispatchEvent(new Event(RULE_EVENT));
    } catch {
      // Local storage can fail in private browsing or quota situations.
    }
  };

  return [ratio, setRatio] as const;
}
