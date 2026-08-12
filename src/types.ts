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

export type ClientRow = {
  id: string;
  user_id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  deal_value: number | string | null;
  created_at: string;
  updated_at: string;
};

export type NoteRow = {
  id: string;
  client_id: string;
  user_id: string;
  body: string;
  created_at: string;
};
