export type ProjectStatus = "active" | "inactive" | "completed" | "on_hold" | "planning";

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  technologies: string[];
  status: ProjectStatus;
  startDate: string;
  expectedEndDate?: string;
  createdAt: string;
  updatedAt: string;
}
