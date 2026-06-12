export type CandidateStatus =
  | "Applied"
  | "HR Interview"
  | "Technical Interview"
  | "Client Interview"
  | "Offered"
  | "Hired"
  | "Discarded";

export type EnglishLevel =
  | "Basic"
  | "Basic / Intermediate"
  | "Intermediate"
  | "Intermediate / Advanced"
  | "Advanced"
  | "Native";

export type CandidateSeniority =
  | "Junior"
  | "Semi Senior"
  | "Senior"
  | "Lead"
  | "Staff"
  | "Principal";

export type SalaryCurrency = "USD" | "ARS" | "BRL" | "UYU";

export type SalaryMode = "Exact" | "Range" | "Not specified";

export type Candidate = {
  id?: string;

  initials: string;
  name: string;

  role: string;
  designation?: string;

  meta: string;

  country: string;

  seniority: CandidateSeniority | string;
  recruiterSeniority?: CandidateSeniority | string;
  technicalSeniority?: CandidateSeniority | string;

  yearsExperience?: string;

  english: EnglishLevel | string;

  status: CandidateStatus | string;

  recruiter: string;
  recruiterInitials: string;

  match: number;

  tags: string[];
  updated: string;

  salary: string;

  currentSalary?: string;
  expectedSalary?: string;
  salaryCurrency?: SalaryCurrency;
  salaryMode?: SalaryMode;
  salaryNotes?: string;

  availability: string;

  email?: string;
  linkedin?: string;
  portfolio?: string;

  strengths: string[];
  risks: string[];

  note: string;

  recruiterConclusion?: string;

  timeline: string[];
};