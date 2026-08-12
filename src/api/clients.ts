import type {
  ClientForm,
  ClientRecord,
  LeadStatus,
  Pagination,
} from "../types";
import { apiRequest } from "./client";

export type ClientListParams = {
  limit: number;
  page: number;
  search?: string;
  status?: LeadStatus | "All";
};

export type ClientPayload = {
  company: string;
  email?: string;
  name: string;
  note?: string;
  phone?: string;
  status: LeadStatus;
  value: number;
};

function formToPayload(form: ClientForm): ClientPayload {
  return {
    company: form.company.trim(),
    email: form.email.trim(),
    name: form.name.trim(),
    note: form.note.trim(),
    phone: form.phone.trim(),
    status: form.status,
    value: Number(form.value || 0),
  };
}

export function createClient(form: ClientForm) {
  return apiRequest<{ client: ClientRecord }>("/clients", {
    body: JSON.stringify(formToPayload(form)),
    method: "POST",
  });
}

export function createClientNote(clientId: string, body: string) {
  return apiRequest<{ note: ClientRecord["notes"][number] }>(
    `/clients/${clientId}/notes`,
    {
      body: JSON.stringify({ body }),
      method: "POST",
    },
  );
}

export function deleteClient(clientId: string) {
  return apiRequest<{ client: ClientRecord }>(`/clients/${clientId}`, {
    method: "DELETE",
  });
}

export function listClients(params: ClientListParams) {
  const query = new URLSearchParams({
    limit: String(params.limit),
    page: String(params.page),
  });

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.status && params.status !== "All") {
    query.set("status", params.status);
  }

  return apiRequest<{ clients: ClientRecord[]; pagination: Pagination }>(
    `/clients?${query.toString()}`,
  );
}

export function patchClient(clientId: string, payload: Partial<ClientPayload>) {
  return apiRequest<{ client: ClientRecord }>(`/clients/${clientId}`, {
    body: JSON.stringify(payload),
    method: "PATCH",
  });
}

export function updateClient(clientId: string, form: ClientForm) {
  const payload = formToPayload(form);

  return apiRequest<{ client: ClientRecord }>(`/clients/${clientId}`, {
    body: JSON.stringify({
      company: payload.company,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      status: payload.status,
      value: payload.value,
    }),
    method: "PUT",
  });
}
