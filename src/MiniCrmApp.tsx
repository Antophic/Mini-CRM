import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { demoClients } from "./demoData";
import {
  demoEmail,
  demoPassword,
  isDemoAccountConfigured,
  isSupabaseConfigured,
  supabase,
} from "./supabaseClient";
import {
  statusOptions,
  type ClientForm,
  type ClientFormErrors,
  type ClientRecord,
  type ClientRow,
  type LeadStatus,
  type NoteRow,
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

const statusClasses: Record<LeadStatus, string> = {
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

function isLeadStatus(value: string): value is LeadStatus {
  return statusOptions.includes(value as LeadStatus);
}

function normalizeValue(value: number | string | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
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

function mapClientRows(clientRows: ClientRow[], noteRows: NoteRow[]) {
  const notesByClient = new Map<string, NoteRow[]>();

  for (const note of noteRows) {
    const list = notesByClient.get(note.client_id) ?? [];
    list.push(note);
    notesByClient.set(note.client_id, list);
  }

  return clientRows.map((client) => ({
    id: client.id,
    userId: client.user_id,
    name: client.name,
    company: client.company,
    email: client.email ?? "",
    phone: client.phone ?? "",
    status: client.status,
    value: normalizeValue(client.deal_value),
    createdAt: client.created_at,
    updatedAt: client.updated_at,
    notes: (notesByClient.get(client.id) ?? []).map((note) => ({
      id: note.id,
      clientId: note.client_id,
      userId: note.user_id,
      body: note.body,
      createdAt: note.created_at,
    })),
  }));
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
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: demoEmail,
    password: "",
  });
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState("");
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

  const user = session?.user ?? null;

  const showToast = useCallback((message: string, tone: Toast["tone"]) => {
    setToast({ message, tone });
  }, []);

  const loadClients = useCallback(
    async (preferredClientId?: string) => {
      if (!supabase || !user) {
        return;
      }

      setClientsLoading(true);
      setClientsError("");

      try {
        const { data: clientRows, error: clientsLoadError } = await supabase
          .from("clients")
          .select(
            "id,user_id,name,company,email,phone,status,deal_value,created_at,updated_at",
          )
          .order("updated_at", { ascending: false })
          .returns<ClientRow[]>();

        if (clientsLoadError) {
          throw clientsLoadError;
        }

        const clientIds = (clientRows ?? []).map((client) => client.id);
        let noteRows: NoteRow[] = [];

        if (clientIds.length > 0) {
          const { data: notes, error: notesLoadError } = await supabase
            .from("client_notes")
            .select("id,client_id,user_id,body,created_at")
            .in("client_id", clientIds)
            .order("created_at", { ascending: false })
            .returns<NoteRow[]>();

          if (notesLoadError) {
            throw notesLoadError;
          }

          noteRows = notes ?? [];
        }

        const mappedClients = mapClientRows(clientRows ?? [], noteRows);
        setClients(mappedClients);
        setSelectedClientId((current) => {
          const preferred = preferredClientId ?? current;
          return mappedClients.some((client) => client.id === preferred)
            ? preferred
            : mappedClients[0]?.id ?? "";
        });
      } catch (error) {
        console.error("Failed to load clients", error);
        setClientsError("We couldn't load your clients. Please try again.");
      } finally {
        setClientsLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    async function loadSession() {
      const { data, error } = await supabase!.auth.getSession();

      if (!active) {
        return;
      }

      if (error) {
        console.error("Failed to load auth session", error);
        setAuthError("Unable to restore your session. Please sign in again.");
      }

      setSession(data.session);
      setAuthLoading(false);
    }

    void loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);

        if (!nextSession) {
          setClients([]);
          setSelectedClientId("");
          setEditingId(null);
          setForm(emptyForm);
          setNoteDraft("");
        }
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void loadClients();
      }
    });

    return () => {
      cancelled = true;
    };
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

  const dashboard = useMemo(() => {
    const active = clients.filter(
      (client) => client.status !== "Won" && client.status !== "Lost",
    ).length;
    const won = clients.filter((client) => client.status === "Won").length;
    const lost = clients.filter((client) => client.status === "Lost").length;
    const notes = clients.reduce((sum, client) => sum + client.notes.length, 0);
    const activeValue = clients
      .filter((client) => client.status !== "Won" && client.status !== "Lost")
      .reduce((sum, client) => sum + client.value, 0);
    const closed = won + lost;
    const closeRate = closed ? Math.round((won / closed) * 100) : 0;

    return {
      active,
      activeValue,
      closeRate,
      notes,
      total: clients.length,
      won,
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesStatus = statusFilter === "All" || client.status === statusFilter;
      const searchSource = [
        client.name,
        client.company,
        client.email,
        client.phone,
        client.status,
        ...client.notes.map((note) => note.body),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchSource.includes(query));
    });
  }, [clients, search, statusFilter]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setAuthError("Supabase is not configured for this deployment.");
      return;
    }

    const email = loginForm.email.trim();
    const password = loginForm.password;

    if (!email || !password) {
      setAuthError("Enter your email and password.");
      return;
    }

    setLoginSubmitting(true);
    setAuthError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Failed to sign in", error);
      setAuthError("Unable to sign in. Check your email and password.");
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    if (!isDemoAccountConfigured) {
      setAuthError("Demo account is not configured for this deployment.");
      return;
    }

    setLoginForm({ email: demoEmail, password: demoPassword });
    setLoginSubmitting(true);
    setAuthError("");

    try {
      const { error } = await supabase!.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Failed to sign in with demo account", error);
      setAuthError("Unable to access the demo account.");
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleLogout() {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Failed to sign out", error);
      showToast("Unable to sign out. Please try again.", "error");
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
    if (!supabase || !user) {
      throw new Error("Missing authenticated user.");
    }

    const value = Number(clientForm.value || 0);
    const payload = {
      user_id: user.id,
      name: clientForm.name.trim(),
      company: clientForm.company.trim(),
      email: clientForm.email.trim() || null,
      phone: clientForm.phone.trim() || null,
      status: clientForm.status,
      deal_value: value,
    };

    if (clientId) {
      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", clientId);

      if (error) {
        throw error;
      }

      return clientId;
    }

    const { data, error } = await supabase
      .from("clients")
      .insert(payload)
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw error;
    }

    return data.id;
  }

  async function insertNote(clientId: string, body: string) {
    if (!supabase || !user || !body.trim()) {
      return;
    }

    const { error } = await supabase.from("client_notes").insert({
      client_id: clientId,
      user_id: user.id,
      body: body.trim(),
    });

    if (error) {
      throw error;
    }
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
      await insertNote(savedClientId, form.note);
      await loadClients(savedClientId);
      resetClientForm();
      showToast(
        editingId ? "Client updated successfully." : "Client added successfully.",
        "success",
      );
    } catch (error) {
      console.error("Failed to save client", error);
      showToast("Unable to save the client. Please try again.", "error");
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
    if (!supabase) {
      return;
    }

    setStatusUpdatingId(clientId);

    try {
      const { error } = await supabase
        .from("clients")
        .update({ status })
        .eq("id", clientId);

      if (error) {
        throw error;
      }

      await loadClients(clientId);
      showToast("Client status updated.", "success");
    } catch (error) {
      console.error("Failed to update status", error);
      showToast("Unable to update the status. Please try again.", "error");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function confirmDeleteClient() {
    if (!supabase || !deleteTarget) {
      return;
    }

    setDeletingClient(true);

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) {
        throw error;
      }

      if (editingId === deleteTarget.id) {
        resetClientForm();
      }

      setDeleteTarget(null);
      await loadClients();
      showToast("Client deleted successfully.", "success");
    } catch (error) {
      console.error("Failed to delete client", error);
      showToast("Unable to delete the client. Please try again.", "error");
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
      await insertNote(selectedClient.id, noteDraft);
      await loadClients(selectedClient.id);
      setNoteDraft("");
      showToast("Note added.", "success");
    } catch (error) {
      console.error("Failed to add note", error);
      showToast("Unable to add the note. Please try again.", "error");
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function loadDemoData() {
    if (!user) {
      return;
    }

    setLoadingDemoData(true);

    try {
      let firstClientId = "";

      for (const demoClient of demoClients) {
        const clientId = await saveClientForm(demoClient);
        await insertNote(clientId, demoClient.note);
        firstClientId ||= clientId;
      }

      await loadClients(firstClientId);
      showToast("Demo clients added successfully.", "success");
    } catch (error) {
      console.error("Failed to add demo data", error);
      showToast("Unable to add demo data. Please try again.", "error");
    } finally {
      setLoadingDemoData(false);
    }
  }

  function focusClientForm() {
    nameInputRef.current?.focus();
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="login-page">
        <section className="login-shell setup-shell" aria-labelledby="setup-title">
          <div className="login-panel">
            <div className="brand-row">
              <span className="brand-mark">M</span>
              <div>
                <p className="eyebrow">Setup Required</p>
                <h1 id="setup-title">Mini CRM</h1>
              </div>
            </div>
            <div className="setup-message">
              <h2>Connect Supabase to run the CRM</h2>
              <p>
                Add the public Supabase URL and anon key to your environment
                variables, then redeploy the application.
              </p>
              <code>VITE_SUPABASE_URL</code>
              <code>VITE_SUPABASE_ANON_KEY</code>
            </div>
          </div>
          <aside className="login-preview">
            <p className="eyebrow">Portfolio Demo</p>
            <p className="muted">
              The app is ready for a database-backed deployment with
              authentication, row-level security, client CRUD, notes, and sales
              metrics.
            </p>
          </aside>
        </section>
      </main>
    );
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

            <form className="login-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  autoComplete="email"
                  name="email"
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  type="email"
                  value={loginForm.email}
                />
              </label>

              <label>
                Password
                <input
                  autoComplete="current-password"
                  name="password"
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  type="password"
                  value={loginForm.password}
                />
              </label>

              {authError ? <p className="form-error">{authError}</p> : null}

              <div className="login-actions">
                <button
                  className="button primary"
                  disabled={loginSubmitting}
                  type="submit"
                >
                  {loginSubmitting ? "Signing in..." : "Sign In"}
                </button>
                <button
                  className="button secondary"
                  disabled={loginSubmitting || !isDemoAccountConfigured}
                  onClick={handleDemoLogin}
                  type="button"
                >
                  Demo Account
                </button>
              </div>

              <p className="demo-hint">
                {isDemoAccountConfigured
                  ? `Demo: ${demoEmail}`
                  : "Configure a demo account in Vercel environment variables."}
              </p>
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
            Track leads, deal values, activities, and follow-ups from one simple
            workspace.
          </p>
        </section>

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
                    {statusOptions.map((status) => (
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
                Initial Note
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
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search clients, companies, email, or notes"
                  value={search}
                />
                <select
                  aria-label="Filter by status"
                  onChange={(event) => {
                    const value = event.target.value;
                    setStatusFilter(value === "All" ? "All" : (value as LeadStatus));
                  }}
                  value={statusFilter}
                >
                  <option value="All">All Statuses</option>
                  {statusOptions.map((status) => (
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
            ) : filteredClients.length > 0 ? (
              <div className="client-list-rows">
                <div className="client-table-head" aria-hidden="true">
                  <span>Client</span>
                  <span>Status and value</span>
                  <span>Actions</span>
                </div>
                {filteredClients.map((client) => (
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
                        className={`status-pill ${statusClasses[client.status]}`}
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
                        {statusOptions.map((status) => (
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
            ) : (
              <div className="empty-state">
                {clients.length === 0 ? (
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
                    <h3>No clients match your search.</h3>
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
                    className={`status-pill ${statusClasses[selectedClient.status]}`}
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
