export type JobApplicationStage =
  | "sourced"
  | "recruiter_screen"
  | "technical_interview"
  | "client_review"
  | "offer"
  | "hired"
  | "rejected";

export type JobApplicationStatus =
  | "active"
  | "hired"
  | "rejected"
  | "withdrawn";

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  candidateRole: string;
  stage: JobApplicationStage;
  status: JobApplicationStatus;
  matchScore: number;
  lastActivityAt: string;
  notes?: string;
}