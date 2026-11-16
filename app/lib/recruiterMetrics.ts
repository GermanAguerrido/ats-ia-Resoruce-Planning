import type {
    CandidateMini,
    CandidateProcessStatus,
    PositionCard,
    ProjectColumn,
  } from "@/app/data/resourcePlanningMock";
  
  import {
    daysBetween,
    getDaysInCurrentStage,
    getStageHistory,
    isHiredCandidate,
    isInProcessCandidate,
    todayIso,
  } from "./candidateStatus";
  import { roleKey } from "./roles";
  import {
    SLA_STAGES,
    slaKeyOf,
    slaLevelFor,
    type SlaConfig,
    type SlaLevel,
    type SlaStageKey,
  } from "./stageSla";
  
  export type MetricsPeriod = "30d" | "90d" | "ytd";
  
  export const PERIOD_LABELS: Record<MetricsPeriod, string> = {
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    ytd: "Year to date",
  };
  
  export type CandidateRef = {
    project: ProjectColumn;
    position: PositionCard;
    candidate: CandidateMini;
  };
  
  export function flattenCandidates(projects: ProjectColumn[]): CandidateRef[] {
    return projects.flatMap((project) =>
      project.positions.flatMap((position) =>
        position.candidates.map((candidate) => ({ project, position, candidate }))
      )
    );
  }
  
  /** Primer día del período (AAAA-MM-DD). */
  export function periodStartIso(period: MetricsPeriod, now = new Date()) {
    if (period === "ytd") {
      return `${now.getFullYear()}-01-01`;
    }
  
    const days = period === "30d" ? 30 : 90;
  
    return new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10);
  }
  
  // ---------- Posición de cada etapa en el flujo ----------
  const FLOW_ORDER: SlaStageKey[] = SLA_STAGES.map((stage) => stage.key);
  
  function flowIndex(status: CandidateProcessStatus) {
    const key = slaKeyOf(status);
  
    return key ? FLOW_ORDER.indexOf(key) : -1;
  }
  
  /** Etapa más avanzada a la que llegó la persona (según su historial y su estado actual). */
  function furthestIndex(candidate: CandidateMini) {
    let furthest = flowIndex(candidate.processStatus);
  
    getStageHistory(candidate).forEach((entry) => {
      furthest = Math.max(furthest, flowIndex(entry.status));
    });
  
    if (isHiredCandidate(candidate)) {
      furthest = FLOW_ORDER.length - 1;
    }
  
    return furthest;
  }
  
  /** Fecha en que la persona entró a la posición (AAAA-MM-DD). */
  function broughtAt(candidate: CandidateMini) {
    return (
      candidate.processStartedAt?.slice(0, 10) ??
      getStageHistory(candidate)[0]?.enteredAt?.slice(0, 10) ??
      ""
    );
  }
  
  // ---------- Estadísticas ----------
  export type StageStat = {
    key: SlaStageKey;
    // Promedio de días en la etapa (null si no hay datos)
    avg: number | null;
    samples: number;
    level: SlaLevel | null;
    // % que pasó a la etapa siguiente entre quienes ya la dejaron (null si no hay datos)
    passedToNext: number | null;
  };
  
  export type RecruiterStats = {
    name: string;
    candidates: number;
    inProcess: number;
    hired: number;
    notInProcess: number;
    byRole: Array<{ role: string; count: number }>;
    stages: StageStat[];
    // Etapa que más se pasa de su máximo esperado
    bottleneck: { key: SlaStageKey; avg: number; ratio: number; level: SlaLevel } | null;
  };
  
  function round1(value: number) {
    return Math.round(value * 10) / 10;
  }
  
  /** Métricas de un grupo de candidatos (los de una recruiter, o todos). */
  export function computeStats(
    name: string,
    refs: CandidateRef[],
    period: MetricsPeriod,
    config: SlaConfig
  ): RecruiterStats {
    const start = periodStartIso(period);
    const inPeriod = refs.filter(({ candidate }) => broughtAt(candidate) >= start);
    const today = todayIso();
  
    const sums = new Map<SlaStageKey, { total: number; count: number }>();
    const addSample = (key: SlaStageKey, days: number) => {
      const current = sums.get(key) ?? { total: 0, count: 0 };
  
      sums.set(key, { total: current.total + days, count: current.count + 1 });
    };
  
    refs.forEach(({ candidate }) => {
      getStageHistory(candidate).forEach((entry) => {
        const key = slaKeyOf(entry.status);
  
        if (!key || key === "hired" || entry.enteredAt.slice(0, 10) < start) {
          return;
        }
  
        // Si la etapa sigue abierta se cuentan los días hasta hoy: así se ven las que están trabadas
        addSample(key, daysBetween(entry.enteredAt, entry.leftAt ?? today));
      });
  
      // Contratación → inicio: el período de preaviso del candidato
      if (candidate.hiredAt && candidate.startDate && candidate.hiredAt.slice(0, 10) >= start) {
        addSample("hired", daysBetween(candidate.hiredAt, candidate.startDate));
      }
    });
  
    // Conversión: entre quienes ya salieron de la etapa, cuántos avanzaron a la siguiente
    const reached = FLOW_ORDER.map(
      (_, index) => inPeriod.filter(({ candidate }) => furthestIndex(candidate) >= index).length
    );
    const pending = FLOW_ORDER.map(
      (_, index) =>
        inPeriod.filter(({ candidate }) => {
          const status = candidate.processStatus;
  
          return furthestIndex(candidate) === index && (flowIndex(status) === index || status === "stand_by");
        }).length
    );
  
    const stages: StageStat[] = FLOW_ORDER.map((key, index) => {
      const sum = sums.get(key);
      const avg = sum ? round1(sum.total / sum.count) : null;
      const left = reached[index] - pending[index];
      const next = index + 1 < FLOW_ORDER.length ? reached[index + 1] : 0;
  
      return {
        key,
        avg,
        samples: sum?.count ?? 0,
        level: avg === null ? null : slaLevelFor(avg, config[key]),
        passedToNext:
          index + 1 >= FLOW_ORDER.length || left <= 0
            ? null
            : Math.min(100, Math.round((next / left) * 100)),
      };
    });
  
    const roles = new Map<string, { role: string; count: number }>();
  
    inPeriod.forEach(({ candidate }) => {
      const key = roleKey(candidate.role) || "other";
      const current = roles.get(key) ?? { role: candidate.role || "Other", count: 0 };
  
      roles.set(key, { ...current, count: current.count + 1 });
    });
  
    let bottleneck: RecruiterStats["bottleneck"] = null;
  
    stages.forEach((stage) => {
      if (stage.avg === null) {
        return;
      }
  
      const ratio = stage.avg / config[stage.key].max;
  
      if (!bottleneck || ratio > bottleneck.ratio) {
        bottleneck = {
          key: stage.key,
          avg: stage.avg,
          ratio,
          level: slaLevelFor(stage.avg, config[stage.key]),
        };
      }
    });
  
    return {
      name,
      candidates: inPeriod.length,
      inProcess: refs.filter(({ candidate }) => isInProcessCandidate(candidate)).length,
      hired: refs.filter(
        ({ candidate }) =>
          isHiredCandidate(candidate) && (candidate.hiredAt ?? "").slice(0, 10) >= start
      ).length,
      notInProcess: inPeriod.filter(({ candidate }) => !isInProcessCandidate(candidate)).length,
      byRole: Array.from(roles.values()).sort((a, b) => b.count - a.count),
      stages,
      bottleneck,
    };
  }
  
  /** Métricas de cada recruiter (por dueño del candidato). */
  export function buildRecruiterStats(
    projects: ProjectColumn[],
    recruiters: string[],
    period: MetricsPeriod,
    config: SlaConfig
  ): RecruiterStats[] {
    const refs = flattenCandidates(projects);
  
    return recruiters.map((name) =>
      computeStats(
        name,
        refs.filter(({ candidate }) => candidate.recruiterOwner === name),
        period,
        config
      )
    );
  }
  
  // ---------- Pipeline del Dashboard ----------
  export type PipelineStat = {
    key: SlaStageKey;
    label: string;
    count: number;
    // Promedio de días de quienes están hoy en la etapa (en Hired: días de contratación a inicio)
    avg: number | null;
    level: SlaLevel | null;
  };
  
  export function buildPipelineStats(projects: ProjectColumn[], config: SlaConfig): PipelineStat[] {
    const refs = flattenCandidates(projects);
  
    return SLA_STAGES.map((stage) => {
      const here = refs.filter(({ candidate }) =>
        stage.key === "hired"
          ? isHiredCandidate(candidate)
          : !isHiredCandidate(candidate) && slaKeyOf(candidate.processStatus) === stage.key
      );
  
      const days = here
        .map(({ candidate }) => {
          if (stage.key === "hired") {
            return candidate.hiredAt && candidate.startDate
              ? daysBetween(candidate.hiredAt, candidate.startDate)
              : null;
          }
  
          return getDaysInCurrentStage(candidate);
        })
        .filter((value): value is number => value !== null);
  
      const avg = days.length ? round1(days.reduce((a, b) => a + b, 0) / days.length) : null;
  
      return {
        key: stage.key,
        label: stage.label,
        count: here.length,
        avg,
        level: avg === null ? null : slaLevelFor(avg, config[stage.key]),
      };
    });
  }
  
  /** Paso 1 (Requisition): días desde que se abre la posición hasta su primer candidato. */
  export function requisitionAverage(projects: ProjectColumn[]): { avg: number | null; samples: number } {
    const days: number[] = [];
  
    projects.forEach((project) =>
      project.positions.forEach((position) => {
        if (!position.openedAt) {
          return;
        }
  
        const first = position.candidates
          .map(broughtAt)
          .filter(Boolean)
          .sort()[0];
  
        if (first) {
          days.push(daysBetween(position.openedAt, first));
        }
      })
    );
  
    return {
      avg: days.length ? round1(days.reduce((a, b) => a + b, 0) / days.length) : null,
      samples: days.length,
    };
  }
  