import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { createClient, createClientNote, deleteClient, patchClient, updateClient } from "./api/clients";
import { AuthForm } from "./components/AuthForm";
import { BrandMark } from "./components/BrandMark";
import { ClientDetails } from "./components/ClientDetails";
import { ClientForm } from "./components/ClientForm";
import { ClientList } from "./components/ClientList";
import { DashboardMetrics } from "./components/DashboardMetrics";
import { DeleteClientModal } from "./components/DeleteClientModal";
import { Toast, type ToastMessage } from "./components/Toast";
import { demoClients } from "./demoData";
import { useAuth } from "./hooks/useAuth";
import { useClients } from "./hooks/useClients";
import { useDashboard } from "./hooks/useDashboard";
import type {
  ClientForm as ClientFormState,
  ClientFormErrors,
  ClientRecord,
  LeadStatus,
} from "./types";
import { emptyForm, validateClientForm } from "./utils/clientForm";
import { getErrorMessage } from "./utils/errors";

export function MiniCrmApp() {
  const [deleteTarget, setDeleteTarget] = useState<ClientRecord | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({});
  const [loadingDemoData, setLoadingDemoData] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [savingClient, setSavingClient] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, tone: ToastMessage["tone"]) => {
    setToast({ message, tone });
  }, []);

  const auth = useAuth(showToast);
  const dashboardState = useDashboard(auth.user);
  const clientState = useClients(auth.user);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function resetClientForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormErrors({});
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

  async function saveClientForm(clientForm: ClientFormState, clientId?: string) {
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
      clientState.setPage(1);
      await Promise.all([
        clientState.loadClients(savedClientId, 1),
        dashboardState.loadDashboard(),
      ]);
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
    clientState.setSelectedClientId(client.id);
    setForm({
      company: client.company,
      email: client.email,
      name: client.name,
      note: "",
      phone: client.phone,
      status: client.status,
      value: client.value ? String(client.value) : "",
    });
    setFormErrors({});
    window.scrollTo({ behavior: "smooth", top: 0 });
  }

  async function updateClientStatus(clientId: string, status: LeadStatus) {
    setStatusUpdatingId(clientId);

    try {
      await patchClient(clientId, { status });
      await Promise.all([
        clientState.loadClients(clientId),
        dashboardState.loadDashboard(),
      ]);
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
      await Promise.all([
        clientState.loadClients(undefined),
        dashboardState.loadDashboard(),
      ]);
      showToast("Client deleted successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to delete the client."), "error");
    } finally {
      setDeletingClient(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientState.selectedClient || !noteDraft.trim()) {
      return;
    }

    setNoteSubmitting(true);

    try {
      await createClientNote(clientState.selectedClient.id, noteDraft.trim());
      await Promise.all([
        clientState.loadClients(clientState.selectedClient.id),
        dashboardState.loadDashboard(),
      ]);
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

      clientState.setPage(1);
      await Promise.all([
        clientState.loadClients(firstClientId, 1),
        dashboardState.loadDashboard(),
      ]);
      showToast("Demo clients added successfully.", "success");
    } catch (error) {
      showToast(getErrorMessage(error, "Unable to add demo data."), "error");
    } finally {
      setLoadingDemoData(false);
    }
  }

  async function handleLogout() {
    await auth.signOut();
    resetClientForm();
    setDeleteTarget(null);
    setNoteDraft("");
  }

  function focusClientForm() {
    nameInputRef.current?.focus();
  }

  if (auth.authLoading) {
    return (
      <main className="loading-page" aria-live="polite">
        <BrandMark />
        <p>Loading your workspace...</p>
      </main>
    );
  }

  if (!auth.user) {
    return (
      <AuthForm
        authError={auth.authError}
        authForm={auth.authForm}
        authMode={auth.authMode}
        authSubmitting={auth.authSubmitting}
        onFieldChange={auth.updateAuthField}
        onSubmit={auth.handleAuthSubmit}
        onToggleMode={auth.switchAuthMode}
      />
    );
  }

  return (
    <div className="app-shell">
      <Toast toast={toast} />

      <header className="topbar">
        <div className="brand-row">
          <BrandMark />
          <div>
            <p className="eyebrow">Sales Workspace</p>
            <h1>Mini CRM</h1>
          </div>
        </div>

        <div className="user-actions">
          <span className="user-chip">{auth.user.email}</span>
          <span className="role-chip">{auth.user.role.toLowerCase()}</span>
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

        <DashboardMetrics
          dashboard={dashboardState.dashboard}
          error={dashboardState.dashboardError}
        />

        <section className="work-grid">
          <ClientForm
            availableStatuses={dashboardState.availableStatuses}
            editingId={editingId}
            errors={formErrors}
            form={form}
            inputRef={nameInputRef}
            onCancelEdit={resetClientForm}
            onChange={handleFormChange}
            onSubmit={handleSaveClient}
            savingClient={savingClient}
          />

          <ClientList
            availableStatuses={dashboardState.availableStatuses}
            clients={clientState.clients}
            clientsError={clientState.clientsError}
            clientsLoading={clientState.clientsLoading}
            deletingClient={deletingClient}
            hasActiveFilters={clientState.hasActiveFilters}
            loadingDemoData={loadingDemoData}
            onDelete={setDeleteTarget}
            onEdit={editClient}
            onFocusClientForm={focusClientForm}
            onLoadDemoData={() => void loadDemoData()}
            onNextPage={() =>
              clientState.setPage((current) =>
                Math.min(clientState.pagination.totalPages, current + 1),
              )
            }
            onPreviousPage={() =>
              clientState.setPage((current) => Math.max(1, current - 1))
            }
            onRetry={() => void clientState.loadClients()}
            onSearchChange={clientState.setSearch}
            onSelectClient={clientState.setSelectedClientId}
            onStatusChange={(clientId, status) => void updateClientStatus(clientId, status)}
            onStatusFilterChange={clientState.setStatusFilter}
            pagination={clientState.pagination}
            savingClient={savingClient}
            search={clientState.search}
            selectedClientId={clientState.selectedClientId}
            statusFilter={clientState.statusFilter}
            statusUpdatingId={statusUpdatingId}
          />

          <ClientDetails
            noteDraft={noteDraft}
            noteSubmitting={noteSubmitting}
            onAddNote={addNote}
            onNoteDraftChange={setNoteDraft}
            selectedClient={clientState.selectedClient}
          />
        </section>
      </main>

      <DeleteClientModal
        deletingClient={deletingClient}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDeleteClient()}
        target={deleteTarget}
      />
    </div>
  );
}
