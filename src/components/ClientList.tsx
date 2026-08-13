import type { ClientRecord, LeadStatus, Pagination } from "../types";
import {
  formatCurrency,
  getInitials,
  getStatusClass,
} from "../utils/formatters";

type ClientListProps = {
  availableStatuses: readonly LeadStatus[];
  clients: ClientRecord[];
  clientsError: string;
  clientsLoading: boolean;
  deletingClient: boolean;
  hasActiveFilters: boolean;
  loadingDemoData: boolean;
  onDelete: (client: ClientRecord) => void;
  onEdit: (client: ClientRecord) => void;
  onFocusClientForm: () => void;
  onLoadDemoData: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onRetry: () => void;
  onSearchChange: (value: string) => void;
  onSelectClient: (clientId: string) => void;
  onStatusChange: (clientId: string, status: LeadStatus) => void;
  onStatusFilterChange: (status: LeadStatus | "All") => void;
  pagination: Pagination;
  savingClient: boolean;
  search: string;
  selectedClientId: string;
  statusFilter: LeadStatus | "All";
  statusUpdatingId: string | null;
};

export function ClientList({
  availableStatuses,
  clients,
  clientsError,
  clientsLoading,
  deletingClient,
  hasActiveFilters,
  loadingDemoData,
  onDelete,
  onEdit,
  onFocusClientForm,
  onLoadDemoData,
  onNextPage,
  onPreviousPage,
  onRetry,
  onSearchChange,
  onSelectClient,
  onStatusChange,
  onStatusFilterChange,
  pagination,
  savingClient,
  search,
  selectedClientId,
  statusFilter,
  statusUpdatingId,
}: ClientListProps) {
  return (
    <section className="panel list-panel" aria-labelledby="client-list">
      <div className="panel-heading list-heading">
        <div>
          <p className="eyebrow">Pipeline</p>
          <h2 id="client-list">Client Pipeline</h2>
        </div>

        <div className="filters">
          <input
            aria-label="Search clients"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search clients, companies, email, or notes"
            value={search}
          />
          <select
            aria-label="Filter by status"
            onChange={(event) => {
              const value = event.target.value;
              onStatusFilterChange(value === "All" ? "All" : (value as LeadStatus));
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
          <button className="button secondary" onClick={onRetry} type="button">
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
                className={`client-row ${client.id === selectedClientId ? "is-selected" : ""}`}
                key={client.id}
              >
                <button
                  className="client-main"
                  onClick={() => onSelectClient(client.id)}
                  type="button"
                >
                  <span className="client-avatar">{getInitials(client.name)}</span>
                  <span className="client-copy">
                    <strong>{client.name}</strong>
                    <span>{client.company}</span>
                    <small>{client.email || client.phone || "-"}</small>
                  </span>
                </button>

                <div className="client-meta">
                  <span className={`status-pill ${getStatusClass(client.status)}`}>
                    {client.status}
                  </span>
                  <span>{formatCurrency(client.value)}</span>
                  <span>{client.notes.length} notes</span>
                </div>

                <div className="client-actions">
                  <select
                    aria-label={`Change status for ${client.name}`}
                    disabled={statusUpdatingId === client.id}
                    onChange={(event) => onStatusChange(client.id, event.target.value as LeadStatus)}
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
                    onClick={() => onEdit(client)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="button danger"
                    disabled={deletingClient}
                    onClick={() => onDelete(client)}
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
              Page {pagination.page} of {pagination.totalPages} - {pagination.total} clients
            </span>
            <div>
              <button
                className="button secondary"
                disabled={pagination.page <= 1 || clientsLoading}
                onClick={onPreviousPage}
                type="button"
              >
                Previous
              </button>
              <button
                className="button secondary"
                disabled={pagination.page >= pagination.totalPages || clientsLoading}
                onClick={onNextPage}
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
                <button className="button primary" onClick={onFocusClientForm} type="button">
                  Add Client
                </button>
                <button
                  className="button secondary"
                  disabled={loadingDemoData}
                  onClick={onLoadDemoData}
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
  );
}
