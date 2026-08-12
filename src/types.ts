export const statusOptions = [
  "New Lead",
  "Contacted",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export type LeadStatus = (typeof statusOptions)[number];

export type ClientNote = {
  id: string;
  clientId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientRecord = {
  id: string;
  userId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  value: number;
  notes: ClientNote[];
  createdAt: string;
  updatedAt: string;
};

export type ClientForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  value: string;
  note: string;
};

export type ClientFormErrors = Partial<Record<keyof ClientForm, string>>;

export type UserRole = "ADMIN" | "USER";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

export type Pagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type PipelineStage = {
  clients?: number;
  isClosed: boolean;
  isWon: boolean;
  key: string;
  label: LeadStatus;
  sortOrder: number;
  value?: number;
};

export type DashboardMetrics = {
  active: number;
  activeValue: number;
  closeRate: number;
  notes: number;
  pipeline: PipelineStage[];
  total: number;
  totalValue: number;
  won: number;
};
