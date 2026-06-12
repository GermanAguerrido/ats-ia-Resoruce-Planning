export type JobStatus = "open" | "completed" | "on_hold" | "closed";

export type JobPriority = "high" | "medium" | "low";

export type JobSeniority =
  | "Junior"
  | "Semi Senior"
  | "Senior"
  | "Lead"
  | "Principal";

export type JobDeadlineType = "fixed_date" | "asap";

export interface Job {
  id: string;
  clientId: string;           // ← NUEVO
  projectId: string;          // ← NUEVO
  client: string;
  project: string;
  position: string;
  seniority: JobSeniority;
  startDate: string;
  deadlineType: JobDeadlineType;
  deadlineDate?: string;
  priority: JobPriority;
  quantity: number;
  status: JobStatus;
  statusChangedAt?: string;
  statusNote?: string;
  completedCandidateName?: string;
  jdSummary: string;
  requiredSkills: string[];
}
