import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ApiError } from "./api/client";
import {
  createClient,
  createClientNote,
  deleteClient,
  listClients,
  patchClient,
  updateClient,
} from "./api/clients";
import { getDashboard } from "./api/dashboard";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "./api/auth";
import { listPipelineStages } from "./api/pipeline";
import { demoClients } from "./demoData";
import {
  statusOptions,
  type AuthUser,
  type ClientForm,
  type ClientFormErrors,
  type ClientRecord,
  type DashboardMetrics,
  type LeadStatus,
  type Pagination,
  type PipelineStage,
} from "./types";

const emptyForm: ClientForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "New Lead",
  value: "",
  note: "",
};

const emptyDashboard: DashboardMetrics = {
  active: 0,
  activeValue: 0,
  closeRate: 0,
  notes: 0,
  pipeline: [],
  total: 0,
  totalValue: 0,
  won: 0,
};

const initialPagination: Pagination = {
  limit: 10,
  page: 1,
  total: 0,
  totalPages: 1,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const statusClasses: Record<string, string> = {
  "New Lead": "status-new",
  Contacted: "status-contacted",
  Proposal: "status-proposal",
  Negotiation: "status-negotiation",
  Won: "status-won",
  Lost: "status-lost",
};

type Toast = {
  message: string;
  tone: "success" | "error";
};

type AuthMode = "login" | "register";

function isLeadStatus(value: string): value is LeadStatus {
  return statusOptions.includes(value as LeadStatus);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return dateFormatter.format(parsed);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function isValidEmail(value: string) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStatusClass(status: string) {
  return statusClasses[status] ?? "status-new";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
}

function validateClientForm(form: ClientForm) {
  const errors: ClientFormErrors = {};
  const name = form.name.trim();
  const company = form.company.trim();
  const email = form.email.trim();
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

export function MiniCrmApp() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authForm, setAuthForm] = useState({
    email: "",
    name: "",
    password: "",
  });
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardMetrics>(emptyDashboard);
  const [dashboardError, setDashboardError] = useState("");
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");
  const [noteDraft, setNoteDraft] = useState("");
  const [savingClient, setSavingClient] = useState(false);
  const [loadingDemoData, setLoadingDemoData] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const availableStatuses = useMemo(
    () => (pipelineStages.length ? pipelineStages.map((stage) => stage.label) : statusOptions),
    [pipelineStages],
  );

  const showToast = useCallback((message: string, tone: Toast["tone"]) => {
    setToast({ message, tone });
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardError("");

    try {
      const response = await getDashboard();
      setDashboard(response.dashboard);
    } catch (error) {
      setDashboardError(getErrorMessage(error, "Unable to load dashboard metrics."));
    }
  }, []);

  const loadStages = useCallback(async () => {
    try {
      const response = await listPipelineStages();
      setPipelineStages(response.stages);
    } catch (error) {
      console.error("Failed to load pipeline stages", error);
    }
  }, []);

  const loadClients = useCallback(
    async (preferredClientId?: string, requestedPage = page) => {
      setClientsLoading(true);
      setClientsError("");

      try {
        const response = await listClients({
          limit: initialPagination.limit,
          page: requestedPage,
          search,
          status: statusFilter,
        });

        setClients(response.clients);
        setPagination(response.pagination);
        setSelectedClientId((current) => {
          const preferred = preferredClientId ?? current;
          return response.clients.some((client) => client.id === preferred)
            ? preferred
            : response.clients[0]?.id ?? "";
        });
      } catch (error) {
        setClientsError(getErrorMessage(error, "Unable to load clients."));
      } finally {
        setClientsLoading(false);
      }
    },
    [page, search, statusFilter],
  );

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const response = await getCurrentUser();

        if (active) {
          setUser(response.user);
        }
      } catch (error) {
        if (active && !(error instanceof ApiError && error.status === 401)) {
          setAuthError("API server is not reachable. Start the backend and try again.");
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      void loadStages();
      void loadDashboard();
    });
  }, [loadDashboard, loadStages, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      void loadClients();
    });
  }, [loadClients, user]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!deleteTarget) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDeleteTarget(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [deleteTarget]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== "All");

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = authForm.email.trim();
    const password = authForm.password;

    if (!email || !password) {
      setAuthError("Enter your email and password.");
      return;
    }

    if (authMode === "register" && password.length < 8) {
      setAuthError("Password must contain at least 8 characters.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError("");

    try {
      const response =
        authMode === "register"
          ? await register({
              email,
              name: authForm.name.trim() || undefined,
              password,
            })
          : await login(email, password);

      setUser(response.user);
      setAuthForm({ email: "", name: "", password: "" });
      showToast(
        authMode === "register" ? "Account created successfully." : "Signed in successfully.",
        "success",
      );
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to authenticate."));
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to sign out", error);
    } finally {
      setUser(null);
      setClients([]);
      setDashboard(emptyDashboard);
      setSelectedClientId("");
      setEditingId(null);
      setForm(emptyForm);
      setNoteDraft("");
    }
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
    setFormErrors((current) => ({
      ...current,
      [name]: undefined,
    }));
  }

  function resetClientForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormErrors({});
  }

  async function saveClientForm(clientForm: ClientForm, clientId?: string) {
    if (clientId) {
      const response = await updateClient(clientId, clientForm);

      if (clientForm.note.trim()) {
        await createClientNote(response.client.id, clientForm.note.trim());
      }

      return response.client.id;
    }

    const response = await createClient(clientForm);
    return response.client.id;
  }

  async function handleSaveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateClientForm(form);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSavingClient(true);

    try {
      const savedClientId = await saveClientForm(form, editingId ?? undefined);
      setPage(1);
      await Promise.all([loadClients(savedClientId, 1), loadDashboard()]);
      resetClientForm();
      showToast(
        editingId ? "Client updated successfully." : "Client added successfully.",
        "success",
      );
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to save the client."), "error");
    } finally {
      setSavingClient(false);
    }
  }

  function editClient(client: ClientRecord) {
    setEditingId(client.id);
    setSelectedClientId(client.id);
    setForm({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      status: client.status,
      value: client.value ? String(client.value) : "",
      note: "",
    });
    setFormErrors({});
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  async function updateClientStatus(clientId: string, status: LeadStatus) {
    setStatusUpdatingId(clientId);

    try {
      await patchClient(clientId, { status });
      await Promise.all([loadClients(clientId), loadDashboard()]);
      showToast("Client status updated.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to update the status."), "error");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function confirmDeleteClient() {
    if (!deleteTarget) {
      return;
    }

    setDeletingClient(true);

    try {
      await deleteClient(deleteTarget.id);

      if (editingId === deleteTarget.id) {
        resetClientForm();
      }

      setDeleteTarget(null);
      await Promise.all([loadClients(undefined), loadDashboard()]);
      showToast("Client deleted successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete the client."), "error");
    } finally {
      setDeletingClient(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClient || !noteDraft.trim()) {
      return;
    }

    setNoteSubmitting(true);

    try {
      await createClientNote(selectedClient.id, noteDraft.trim());
      await Promise.all([loadClients(selectedClient.id), loadDashboard()]);
      setNoteDraft("");
      showToast("Note added.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to add the note."), "error");
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function loadDemoData() {
    setLoadingDemoData(true);

    try {
      let firstClientId = "";

      for (const demoClient of demoClients) {
        const response = await createClient(demoClient);
        firstClientId ||= response.client.id;
      }

      setPage(1);
      await Promise.all([loadClients(firstClientId, 1), loadDashboard()]);
      showToast("Demo clients added successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to add demo data."), "error");
    } finally {
      setLoadingDemoData(false);
    }
  }

  function focusClientForm() {
    nameInputRef.current?.focus();
  }

  if (authLoading) {
    return (
      <main className="loading-page" aria-live="polite">
        <span className="brand-mark">M</span>
        <p>Loading your workspace...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="login-page">
        <section className="login-shell" aria-labelledby="login-title">
          <div className="login-panel">
            <div className="brand-row">
              <span className="brand-mark">M</span>
              <div>
                <p className="eyebrow">Sales Workspace</p>
                <h1 id="login-title">Mini CRM</h1>
              </div>
            </div>

            <form className="login-form" onSubmit={handleAuthSubmit}>
              {authMode === "register" ? (
                <label>
                  Name
                  <input
                    autoComplete="name"
                    name="name"
                    onChange={(event) =>
                      setAuthForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Sarah Mitchell"
                    value={authForm.name}
                  />
                </label>
              ) : null}

              <label>
                Email
                <input
                  autoComplete="email"
                  name="email"
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  type="email"
                  value={authForm.email}
                />
              </label>

              <label>
                Password
                <input
                  autoComplete={authMode === "register" ? "new-password" : "current-password"}
                  name="password"
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  type="password"
                  value={authForm.password}
                />
              </label>

              {authError ? <p className="form-error">{authError}</p> : null}

              <div className="login-actions">
                <button
                  className="button primary"
                  disabled={authSubmitting}
                  type="submit"
                >
                  {authSubmitting
                    ? authMode === "register"
                      ? "Creating..."
                      : "Signing in..."
                    : authMode === "register"
                      ? "Create Account"
                      : "Sign In"}
                </button>
                <button
                  className="button secondary"
                  disabled={authSubmitting}
                  onClick={() => {
                    setAuthError("");
                    setAuthMode((current) => (current === "login" ? "register" : "login"));
                  }}
                  type="button"
                >
                  {authMode === "login" ? "Create Account" : "Back to Sign In"}
                </button>
              </div>
            </form>
          </div>

          <aside className="login-preview" aria-label="Pipeline preview">
            <div className="preview-heading">
              <p className="eyebrow">Simple Sales Pipeline</p>
              <strong>{formatCurrency(37650)}</strong>
            </div>
            <div className="preview-bars" aria-hidden="true">
              <span className="bar bar-new" />
              <span className="bar bar-contacted" />
              <span className="bar bar-proposal" />
              <span className="bar bar-won" />
            </div>
            <div className="preview-list">
              {demoClients.map((client) => (
                <div className="preview-row" key={client.email}>
                  <span className="client-avatar">{getInitials(client.name)}</span>
                  <span>
                    <strong>{client.company}</strong>
                    <small>{client.status}</small>
                  </span>
                  <b>{formatCurrency(Number(client.value))}</b>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      {toast ? (
        <div className={`toast toast-${toast.tone}`} role="status">
          {toast.message}
        </div>
      ) : null}

      <header className="topbar">
        <div className="brand-row">
          <span className="brand-mark">M</span>
          <div>
            <p className="eyebrow">Sales Workspace</p>
            <h1>Mini CRM</h1>
          </div>
        </div>

        <div className="user-actions">
          <span className="user-chip">{user.email}</span>
          <span className="role-chip">{user.role.toLowerCase()}</span>
          <button className="button ghost" onClick={handleLogout} type="button">
            Sign Out
          </button>
        </div>
      </header>

      <main className="crm-layout">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Client Pipeline</p>
            <h2>Manage prospects and follow-ups</h2>
          </div>
          <p>
            Track leads, deal values, activities, and follow-ups from one
            authenticated workspace.
          </p>
        </section>

        {dashboardError ? <p className="form-error">{dashboardError}</p> : null}

        <section className="summary-strip" aria-label="Sales dashboard metrics">
          <article className="metric metric-total">
            <span>Total Clients</span>
            <strong>{dashboard.total}</strong>
            <small>All contacts</small>
          </article>
          <article className="metric metric-active">
            <span>Active Leads</span>
            <strong>{dashboard.active}</strong>
            <small>Needs follow-up</small>
          </article>
          <article className="metric metric-won">
            <span>Won Deals</span>
            <strong>{dashboard.won}</strong>
            <small>{dashboard.closeRate}% close rate</small>
          </article>
          <article className="metric metric-value">
            <span>Active Pipeline</span>
            <strong>{formatCurrency(dashboard.activeValue)}</strong>
            <small>Excludes won and lost deals</small>
          </article>
        </section>

        <section className="work-grid">
          <section className="panel form-panel" aria-labelledby="client-form">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Client Data</p>
                <h2 id="client-form">{editingId ? "Edit Client" : "Add Client"}</h2>
              </div>
              {editingId ? (
                <button
                  className="button ghost"
                  disabled={savingClient}
                  onClick={resetClientForm}
                  type="button"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <form className="client-form" onSubmit={handleSaveClient}>
              <label>
                Client Name
                <input
                  ref={nameInputRef}
                  aria-invalid={Boolean(formErrors.name)}
                  name="name"
                  onChange={handleFormChange}
                  placeholder="Sarah Mitchell"
                  value={form.name}
                />
                {formErrors.name ? (
                  <span className="field-error">{formErrors.name}</span>
                ) : null}
              </label>

              <label>
                Company
                <input
                  aria-invalid={Boolean(formErrors.company)}
                  name="company"
                  onChange={handleFormChange}
                  placeholder="Acme Consulting"
                  value={form.company}
                />
                {formErrors.company ? (
                  <span className="field-error">{formErrors.company}</span>
                ) : null}
              </label>

              <label>
                Email
                <input
                  aria-invalid={Boolean(formErrors.email)}
                  name="email"
                  onChange={handleFormChange}
                  placeholder="client@example.test"
                  type="email"
                  value={form.email}
                />
                {formErrors.email ? (
                  <span className="field-error">{formErrors.email}</span>
                ) : null}
              </label>

              <label>
                Phone
                <input
                  aria-invalid={Boolean(formErrors.phone)}
                  name="phone"
                  onChange={handleFormChange}
                  placeholder="+1 415 555 0184"
                  value={form.phone}
                />
                {formErrors.phone ? (
                  <span className="field-error">{formErrors.phone}</span>
                ) : null}
              </label>

              <div className="form-row">
                <label>
                  Pipeline Status
                  <select
                    aria-invalid={Boolean(formErrors.status)}
                    name="status"
                    onChange={handleFormChange}
                    value={form.status}
                  >
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Deal Value
                  <input
                    aria-invalid={Boolean(formErrors.value)}
                    min="0"
                    name="value"
                    onChange={handleFormChange}
                    placeholder="0"
                    type="number"
                    value={form.value}
                  />
                  {formErrors.value ? (
                    <span className="field-error">{formErrors.value}</span>
                  ) : null}
                </label>
              </div>

              <label>
                {editingId ? "New Note" : "Initial Note"}
                <textarea
                  name="note"
                  onChange={handleFormChange}
                  placeholder="Meeting notes, follow-up details, or client needs"
                  rows={4}
                  value={form.note}
                />
              </label>

              <button
                className="button primary full-width"
                disabled={savingClient}
                type="submit"
              >
                {savingClient
                  ? editingId
                    ? "Saving..."
                    : "Adding..."
                  : editingId
                    ? "Save Changes"
                    : "Add Client"}
              </button>
            </form>
          </section>

          <section className="panel list-panel" aria-labelledby="client-list">
            <div className="panel-heading list-heading">
              <div>
                <p className="eyebrow">Pipeline</p>
                <h2 id="client-list">Client Pipeline</h2>
              </div>

              <div className="filters">
                <input
                  aria-label="Search clients"
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  placeholder="Search clients, companies, email, or notes"
                  value={search}
                />
                <select
                  aria-label="Filter by status"
                  onChange={(event) => {
                    const value = event.target.value;
                    setPage(1);
                    setStatusFilter(value === "All" ? "All" : (value as LeadStatus));
                  }}
                  value={statusFilter}
                >
                  <option value="All">All Statuses</option>
                  {availableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {clientsLoading ? (
              <div className="loading-state">Loading clients...</div>
            ) : clientsError ? (
              <div className="empty-state">
                <h3>Unable to load clients</h3>
                <p>{clientsError}</p>
                <button
                  className="button secondary"
                  onClick={() => void loadClients()}
                  type="button"
                >
                  Try Again
                </button>
              </div>
            ) : clients.length > 0 ? (
              <>
                <div className="client-list-rows">
                  <div className="client-table-head" aria-hidden="true">
                    <span>Client</span>
                    <span>Status and value</span>
                    <span>Actions</span>
                  </div>
                  {clients.map((client) => (
                    <article
                      className={`client-row ${
                        client.id === selectedClientId ? "is-selected" : ""
                      }`}
                      key={client.id}
                    >
                      <button
                        className="client-main"
                        onClick={() => setSelectedClientId(client.id)}
                        type="button"
                      >
                        <span className="client-avatar">
                          {getInitials(client.name)}
                        </span>
                        <span className="client-copy">
                          <strong>{client.name}</strong>
                          <span>{client.company}</span>
                          <small>{client.email || client.phone || "-"}</small>
                        </span>
                      </button>

                      <div className="client-meta">
                        <span
                          className={`status-pill ${getStatusClass(client.status)}`}
                        >
                          {client.status}
                        </span>
                        <span>{formatCurrency(client.value)}</span>
                        <span>{client.notes.length} notes</span>
                      </div>

                      <div className="client-actions">
                        <select
                          aria-label={`Change status for ${client.name}`}
                          disabled={statusUpdatingId === client.id}
                          onChange={(event) =>
                            updateClientStatus(
                              client.id,
                              event.target.value as LeadStatus,
                            )
                          }
                          value={client.status}
                        >
                          {availableStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          className="button secondary"
                          disabled={savingClient}
                          onClick={() => editClient(client)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="button danger"
                          disabled={deletingClient}
                          onClick={() => setDeleteTarget(client)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="pagination-bar">
                  <span>
                    Page {pagination.page} of {pagination.totalPages} -{" "}
                    {pagination.total} clients
                  </span>
                  <div>
                    <button
                      className="button secondary"
                      disabled={pagination.page <= 1 || clientsLoading}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      type="button"
                    >
                      Previous
                    </button>
                    <button
                      className="button secondary"
                      disabled={
                        pagination.page >= pagination.totalPages || clientsLoading
                      }
                      onClick={() =>
                        setPage((current) =>
                          Math.min(pagination.totalPages, current + 1),
                        )
                      }
                      type="button"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                {!hasActiveFilters ? (
                  <>
                    <h3>No clients yet</h3>
                    <p>Add your first prospect to start building your sales pipeline.</p>
                    <div className="empty-actions">
                      <button
                        className="button primary"
                        onClick={focusClientForm}
                        type="button"
                      >
                        Add Client
                      </button>
                      <button
                        className="button secondary"
                        disabled={loadingDemoData}
                        onClick={loadDemoData}
                        type="button"
                      >
                        {loadingDemoData ? "Adding demo data..." : "Load Demo Data"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>No clients match your filters.</h3>
                    <p>Try a different keyword or status filter.</p>
                  </>
                )}
              </div>
            )}
          </section>

          <aside className="panel notes-panel" aria-labelledby="notes-title">
            {selectedClient ? (
              <>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Activity</p>
                    <h2 id="notes-title">{selectedClient.name}</h2>
                  </div>
                  <span
                    className={`status-pill ${getStatusClass(selectedClient.status)}`}
                  >
                    {selectedClient.status}
                  </span>
                </div>

                <dl className="client-detail">
                  <div>
                    <dt>Company</dt>
                    <dd>{selectedClient.company}</dd>
                  </div>
                  <div>
                    <dt>Contact</dt>
                    <dd>{selectedClient.email || selectedClient.phone || "-"}</dd>
                  </div>
                  <div>
                    <dt>Last Updated</dt>
                    <dd>{formatDate(selectedClient.updatedAt)}</dd>
                  </div>
                </dl>

                <form className="note-form" onSubmit={addNote}>
                  <label>
                    Add Note
                    <textarea
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Write a follow-up update"
                      rows={3}
                      value={noteDraft}
                    />
                  </label>
                  <button
                    className="button secondary full-width"
                    disabled={noteSubmitting || !noteDraft.trim()}
                    type="submit"
                  >
                    {noteSubmitting ? "Adding..." : "Add Note"}
                  </button>
                </form>

                <div className="notes-list">
                  {selectedClient.notes.length > 0 ? (
                    selectedClient.notes.map((note) => (
                      <article className="note-item" key={note.id}>
                        <p>{note.body}</p>
                        <time dateTime={note.createdAt}>
                          {formatDate(note.createdAt)}
                        </time>
                      </article>
                    ))
                  ) : (
                    <p className="muted">No notes yet.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>Select a client</h3>
                <p>Client details and activity will appear here.</p>
              </div>
            )}
          </aside>
        </section>
      </main>

      {deleteTarget ? (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="delete-title"
            aria-modal="true"
            className="confirm-modal"
            role="dialog"
          >
            <h2 id="delete-title">Delete {deleteTarget.name}?</h2>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="button secondary"
                disabled={deletingClient}
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="button danger"
                disabled={deletingClient}
                onClick={confirmDeleteClient}
                type="button"
              >
                {deletingClient ? "Deleting..." : "Delete Client"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
