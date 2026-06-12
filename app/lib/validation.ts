import { z } from "zod";

export const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Client name is required"),
  description: z.string(),
  country: z.string(),
  industry: z.string().optional(),
  contactEmail: z.string().email("Invalid email"),
  contactPhone: z.string().optional(),
  status: z.enum(["active", "inactive", "prospect", "archived"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProjectSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string(),
  technologies: z.array(z.string()),
  status: z.enum(["active", "inactive", "completed", "on_hold", "planning"]),
  startDate: z.string(),
  expectedEndDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const JobSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  projectId: z.string(),
  client: z.string(),
  project: z.string(),
  position: z.string(),
  seniority: z.enum(["Junior", "Semi Senior", "Senior", "Lead", "Principal"]),
  startDate: z.string(),
  deadlineType: z.enum(["fixed_date", "asap"]),
  deadlineDate: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]),
  quantity: z.number(),
  status: z.enum(["open", "completed", "on_hold", "closed"]),
  jdSummary: z.string(),
  requiredSkills: z.array(z.string()),
});

export const CandidateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  email: z.string().email().optional(),
  status: z.enum(["Applied", "HR Interview", "Technical Interview", "Client Interview", "Offered", "Hired", "Discarded"]),
});

export type Client = z.infer<typeof ClientSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Job = z.infer<typeof JobSchema>;
export type Candidate = z.infer<typeof CandidateSchema>;
