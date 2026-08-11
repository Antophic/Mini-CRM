"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

const statusOptions = [
  "Baru",
  "Dihubungi",
  "Proposal",
  "Menang",
  "Kalah",
] as const;

type LeadStatus = (typeof statusOptions)[number];

type Note = {
  id: string;
  body: string;
  createdAt: string;
};

type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  value: number;
  notes: Note[];
  createdAt: string;
  updatedAt: string;
};

type ClientForm = {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  value: string;
  note: string;
};

type UserSession = {
  email: string;
  name: string;
};

const CLIENTS_KEY = "mini-crm.clients.v1";
const SESSION_KEY = "mini-crm.session.v1";

const emptyForm: ClientForm = {
  name: "",
  company: "",
  email: "",
  phone: "",
  status: "Baru",
  value: "",
  note: "",
};

const seedClients: Client[] = [
  {
    id: "client-seed-1",
    name: "Rina Prasetyo",
    company: "Kopi Senja",
    email: "rina@kopisenja.test",
    phone: "0812-4412-0091",
    status: "Proposal",
    value: 8500000,
    notes: [
      {
        id: "note-seed-1",
        body: "Minta proposal paket dashboard penjualan minggu ini.",
        createdAt: "2026-08-10T09:00:00.000Z",
      },
    ],
    createdAt: "2026-08-09T08:30:00.000Z",
    updatedAt: "2026-08-10T09:00:00.000Z",
  },
  {
    id: "client-seed-2",
    name: "Bayu Santoso",
    company: "Borneo Travel",
    email: "bayu@borneotravel.test",
    phone: "0821-1190-7788",
    status: "Dihubungi",
    value: 5200000,
    notes: [
      {
        id: "note-seed-2",
        body: "Follow up setelah meeting operasional hari Jumat.",
        createdAt: "2026-08-08T11:20:00.000Z",
      },
    ],
    createdAt: "2026-08-07T10:10:00.000Z",
    updatedAt: "2026-08-08T11:20:00.000Z",
  },
  {
    id: "client-seed-3",
    name: "Siti Maulida",
    company: "Studio Karsa",
    email: "siti@studiokarsa.test",
    phone: "0857-3001-4420",
    status: "Menang",
    value: 12000000,
    notes: [
      {
        id: "note-seed-3",
        body: "Deal untuk implementasi tahap pertama.",
        createdAt: "2026-08-06T15:45:00.000Z",
      },
    ],
    createdAt: "2026-08-04T13:00:00.000Z",
    updatedAt: "2026-08-06T15:45:00.000Z",
  },
];

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  currency: "IDR",
  maximumFractionDigits: 0,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const statusClasses: Record<LeadStatus, string> = {
  Baru: "status-new",
  Dihubungi: "status-contacted",
  Proposal: "status-proposal",
  Menang: "status-won",
  Kalah: "status-lost",
};

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isLeadStatus(value: unknown): value is LeadStatus {
  return statusOptions.includes(value as LeadStatus);
}

function toText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeNote(value: unknown): Note | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const body = toText(raw.body).trim();

  if (!body) {
    return null;
  }

  return {
    id: toText(raw.id) || makeId("note"),
    body,
    createdAt: toText(raw.createdAt) || new Date().toISOString(),
  };
}

function normalizeClient(value: unknown): Client | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const name = toText(raw.name).trim();

  if (!name) {
    return null;
  }

  const notes = Array.isArray(raw.notes)
    ? raw.notes
        .map(normalizeNote)
        .filter((note): note is Note => note !== null)
    : [];

  return {
    id: toText(raw.id) || makeId("client"),
    name,
    company: toText(raw.company).trim(),
    email: toText(raw.email).trim(),
    phone: toText(raw.phone).trim(),
    status: isLeadStatus(raw.status) ? raw.status : "Baru",
    value: Math.max(0, toNumber(raw.value)),
    notes,
    createdAt: toText(raw.createdAt) || new Date().toISOString(),
    updatedAt: toText(raw.updatedAt) || new Date().toISOString(),
  };
}

function loadClients() {
  try {
    const rawClients = window.localStorage.getItem(CLIENTS_KEY);

    if (!rawClients) {
      return seedClients;
    }

    const parsed = JSON.parse(rawClients);

    if (!Array.isArray(parsed)) {
      return seedClients;
    }

    const clients = parsed
      .map(normalizeClient)
      .filter((client): client is Client => client !== null);

    return clients.length > 0 ? clients : seedClients;
  } catch {
    return seedClients;
  }
}

function loadSession() {
  try {
    const rawSession = window.localStorage.getItem(SESSION_KEY);

    if (!rawSession) {
      return null;
    }

    const parsed = JSON.parse(rawSession) as Partial<UserSession>;
    const email = toText(parsed.email).trim();
    const name = toText(parsed.name).trim();

    return email ? { email, name: name || email.split("@")[0] } : null;
  } catch {
    return null;
  }
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

export function MiniCrmApp() {
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [loginForm, setLoginForm] = useState({
    email: "demo@minicrm.test",
    password: "password",
  });
  const [loginError, setLoginError] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "Semua">(
    "Semua",
  );
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    const initialClients = loadClients();
    setClients(initialClients);
    setSelectedClientId(initialClients[0]?.id ?? "");
    setUser(loadSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    }
  }, [clients, hydrated]);

  const dashboard = useMemo(() => {
    const active = clients.filter(
      (client) => client.status !== "Menang" && client.status !== "Kalah",
    ).length;
    const won = clients.filter((client) => client.status === "Menang").length;
    const totalValue = clients.reduce((sum, client) => sum + client.value, 0);
    const notes = clients.reduce((sum, client) => sum + client.notes.length, 0);

    return {
      active,
      notes,
      total: clients.length,
      totalValue,
      won,
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients
      .filter((client) => {
        const matchesStatus =
          statusFilter === "Semua" || client.status === statusFilter;
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
      })
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      );
  }, [clients, search, statusFilter]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = loginForm.email.trim();
    const password = loginForm.password.trim();

    if (!email.includes("@") || password.length < 4) {
      setLoginError("Isi email valid dan password minimal 4 karakter.");
      return;
    }

    const session = {
      email,
      name: email.split("@")[0] || "Demo User",
    };

    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setLoginError("");
    setUser(session);
  }

  function handleDemoLogin() {
    const session = {
      email: "demo@minicrm.test",
      name: "Demo User",
    };

    setLoginForm({ email: session.email, password: "password" });
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setLoginError("");
    setUser(session);
  }

  function handleLogout() {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetClientForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError("");
  }

  function handleSaveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();
    const name = form.name.trim();
    const company = form.company.trim();
    const noteBody = form.note.trim();
    const parsedValue = Number(form.value);
    const value = Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
    const nextNote = noteBody
      ? {
          id: makeId("note"),
          body: noteBody,
          createdAt: now,
        }
      : null;

    if (!name || !company) {
      setFormError("Nama client dan company wajib diisi.");
      return;
    }

    if (editingId) {
      setClients((current) =>
        current.map((client) =>
          client.id === editingId
            ? {
                ...client,
                name,
                company,
                email: form.email.trim(),
                phone: form.phone.trim(),
                status: form.status,
                value,
                notes: nextNote ? [nextNote, ...client.notes] : client.notes,
                updatedAt: now,
              }
            : client,
        ),
      );
      setSelectedClientId(editingId);
    } else {
      const client: Client = {
        id: makeId("client"),
        name,
        company,
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        value,
        notes: nextNote ? [nextNote] : [],
        createdAt: now,
        updatedAt: now,
      };

      setClients((current) => [client, ...current]);
      setSelectedClientId(client.id);
    }

    resetClientForm();
  }

  function editClient(client: Client) {
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
    setFormError("");
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  function deleteClient(clientId: string) {
    const client = clients.find((item) => item.id === clientId);

    if (!client || !window.confirm(`Hapus ${client.name} dari CRM?`)) {
      return;
    }

    const remainingClients = clients.filter((item) => item.id !== clientId);
    setClients(remainingClients);

    if (selectedClientId === clientId) {
      setSelectedClientId(remainingClients[0]?.id ?? "");
    }

    if (editingId === clientId) {
      resetClientForm();
    }
  }

  function updateClientStatus(clientId: string, status: LeadStatus) {
    const now = new Date().toISOString();

    setClients((current) =>
      current.map((client) =>
        client.id === clientId ? { ...client, status, updatedAt: now } : client,
      ),
    );
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = noteDraft.trim();

    if (!selectedClient || !body) {
      return;
    }

    const note = {
      id: makeId("note"),
      body,
      createdAt: new Date().toISOString(),
    };

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              notes: [note, ...client.notes],
              updatedAt: note.createdAt,
            }
          : client,
      ),
    );
    setNoteDraft("");
  }

  if (!user) {
    return (
      <main className="login-page">
        <section className="login-panel" aria-labelledby="login-title">
          <div className="brand-row">
            <span className="brand-mark">M</span>
            <div>
              <p className="eyebrow">Project Portfolio #1</p>
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

            {loginError ? <p className="form-error">{loginError}</p> : null}

            <div className="login-actions">
              <button className="button primary" type="submit">
                Masuk
              </button>
              <button
                className="button secondary"
                onClick={handleDemoLogin}
                type="button"
              >
                Masuk Demo
              </button>
            </div>

            <p className="demo-hint">Demo: demo@minicrm.test / password</p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-row">
          <span className="brand-mark">M</span>
          <div>
            <p className="eyebrow">Project Portfolio #1</p>
            <h1>Mini CRM</h1>
          </div>
        </div>

        <div className="user-actions">
          <span>{user.email}</span>
          <button className="button ghost" onClick={handleLogout} type="button">
            Keluar
          </button>
        </div>
      </header>

      <main className="crm-layout">
        <section className="summary-strip" aria-label="Dashboard jumlah client">
          <article className="metric metric-total">
            <span>Total Client</span>
            <strong>{dashboard.total}</strong>
          </article>
          <article className="metric metric-active">
            <span>Lead Aktif</span>
            <strong>{dashboard.active}</strong>
          </article>
          <article className="metric metric-won">
            <span>Menang</span>
            <strong>{dashboard.won}</strong>
          </article>
          <article className="metric metric-value">
            <span>Pipeline</span>
            <strong>{formatCurrency(dashboard.totalValue)}</strong>
          </article>
        </section>

        <section className="work-grid">
          <section className="panel form-panel" aria-labelledby="client-form">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Client</p>
                <h2 id="client-form">
                  {editingId ? "Edit Client" : "Tambah Client"}
                </h2>
              </div>
              {editingId ? (
                <button
                  className="button ghost"
                  onClick={resetClientForm}
                  type="button"
                >
                  Batal
                </button>
              ) : null}
            </div>

            <form className="client-form" onSubmit={handleSaveClient}>
              <label>
                Nama Client
                <input
                  name="name"
                  onChange={handleFormChange}
                  placeholder="Contoh: Andi Wijaya"
                  value={form.name}
                />
              </label>

              <label>
                Company
                <input
                  name="company"
                  onChange={handleFormChange}
                  placeholder="Contoh: Maju Jaya"
                  value={form.company}
                />
              </label>

              <label>
                Email
                <input
                  name="email"
                  onChange={handleFormChange}
                  placeholder="client@email.com"
                  type="email"
                  value={form.email}
                />
              </label>

              <label>
                Telepon
                <input
                  name="phone"
                  onChange={handleFormChange}
                  placeholder="08xx"
                  value={form.phone}
                />
              </label>

              <div className="form-row">
                <label>
                  Status Lead
                  <select
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
                  Nilai Deal
                  <input
                    min="0"
                    name="value"
                    onChange={handleFormChange}
                    placeholder="0"
                    type="number"
                    value={form.value}
                  />
                </label>
              </div>

              <label>
                Note
                <textarea
                  name="note"
                  onChange={handleFormChange}
                  placeholder="Catatan meeting, follow up, atau kebutuhan client"
                  rows={4}
                  value={form.note}
                />
              </label>

              {formError ? <p className="form-error">{formError}</p> : null}

              <button className="button primary full-width" type="submit">
                {editingId ? "Simpan Perubahan" : "Tambah Client"}
              </button>
            </form>
          </section>

          <section className="panel list-panel" aria-labelledby="client-list">
            <div className="panel-heading list-heading">
              <div>
                <p className="eyebrow">Database</p>
                <h2 id="client-list">Daftar Client</h2>
              </div>

              <div className="filters">
                <input
                  aria-label="Cari client"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari client, company, email, notes"
                  value={search}
                />
                <select
                  aria-label="Filter status lead"
                  onChange={(event) =>
                    setStatusFilter(event.target.value as LeadStatus | "Semua")
                  }
                  value={statusFilter}
                >
                  <option value="Semua">Semua status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredClients.length > 0 ? (
              <div className="client-list-rows">
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
                        aria-label={`Ubah status ${client.name}`}
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
                        onClick={() => editClient(client)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="button danger"
                        onClick={() => deleteClient(client.id)}
                        type="button"
                      >
                        Hapus
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>Tidak ada client</h3>
                <p>Tambah client baru atau ubah filter pencarian.</p>
              </div>
            )}
          </section>

          <aside className="panel notes-panel" aria-labelledby="notes-title">
            {selectedClient ? (
              <>
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Notes</p>
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
                    <dt>Kontak</dt>
                    <dd>{selectedClient.email || selectedClient.phone || "-"}</dd>
                  </div>
                  <div>
                    <dt>Update</dt>
                    <dd>{formatDate(selectedClient.updatedAt)}</dd>
                  </div>
                </dl>

                <form className="note-form" onSubmit={addNote}>
                  <label>
                    Catatan Baru
                    <textarea
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Tulis update follow up"
                      rows={3}
                      value={noteDraft}
                    />
                  </label>
                  <button className="button secondary full-width" type="submit">
                    Tambah Note
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
                    <p className="muted">Belum ada notes.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <h3>Pilih client</h3>
                <p>Detail dan notes akan tampil di sini.</p>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
