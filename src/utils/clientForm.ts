import {
  statusOptions,
  type ClientForm,
  type ClientFormErrors,
  type LeadStatus,
} from "../types";

export const emptyForm: ClientForm = {
  company: "",
  email: "",
  name: "",
  note: "",
  phone: "",
  status: "New Lead",
  value: "",
};

export function isLeadStatus(value: string): value is LeadStatus {
  return statusOptions.includes(value as LeadStatus);
}

function isValidEmail(value: string) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateClientForm(form: ClientForm) {
  const errors: ClientFormErrors = {};
  const company = form.company.trim();
  const email = form.email.trim();
  const name = form.name.trim();
  const value = Number(form.value || 0);

  if (!name) {
    errors.name = "Client name is required.";
  }

  if (!company) {
    errors.company = "Company is required.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (form.phone.trim().length > 40) {
    errors.phone = "Phone number is too long.";
  }

  if (!Number.isFinite(value) || value < 0) {
    errors.value = "Deal value must be zero or greater.";
  }

  if (!isLeadStatus(form.status)) {
    errors.status = "Choose a valid pipeline status.";
  }

  return errors;
}
