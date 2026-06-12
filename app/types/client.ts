export type ClientStatus = "active" | "inactive" | "prospect" | "archived";

export interface Client {
  id: string;
  name: string;
  description: string;
  country: string;
  industry?: string;
  contactEmail: string;
  contactPhone?: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}
