import { useCallback, useEffect, useMemo, useState } from "react";
import { listClients } from "../api/clients";
import { initialPagination } from "../constants/crm";
import type {
  AuthUser,
  ClientRecord,
  LeadStatus,
  Pagination,
} from "../types";
import { getErrorMessage } from "../utils/errors";
import { useDebouncedValue } from "./useDebouncedValue";

function resetPagination(): Pagination {
  return { ...initialPagination };
}

export function useClients(user: AuthUser | null) {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientsError, setClientsError] = useState("");
  const [clientsLoading, setClientsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>(resetPagination);
  const [search, setSearchValue] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [statusFilter, setStatusFilterValue] = useState<LeadStatus | "All">("All");
  const debouncedSearch = useDebouncedValue(search, 350);

  const loadClients = useCallback(
    async (preferredClientId?: string, requestedPage = page) => {
      setClientsLoading(true);
      setClientsError("");

      try {
        let response = await listClients({
          limit: initialPagination.limit,
          page: requestedPage,
          search: debouncedSearch,
          status: statusFilter,
        });

        if (requestedPage > response.pagination.totalPages) {
          const lastValidPage = response.pagination.totalPages;
          setPage(lastValidPage);
          response = await listClients({
            limit: initialPagination.limit,
            page: lastValidPage,
            search: debouncedSearch,
            status: statusFilter,
          });
        }

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
    [debouncedSearch, page, statusFilter],
  );

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => {
        setClients([]);
        setClientsError("");
        setClientsLoading(false);
        setPage(1);
        setPagination(resetPagination());
        setSearchValue("");
        setSelectedClientId("");
        setStatusFilterValue("All");
      });
      return;
    }

    queueMicrotask(() => {
      void loadClients();
    });
  }, [loadClients, user]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const setSearch = useCallback((value: string) => {
    setPage(1);
    setSearchValue(value);
  }, []);

  const setStatusFilter = useCallback((value: LeadStatus | "All") => {
    setPage(1);
    setStatusFilterValue(value);
  }, []);

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== "All");

  return {
    clients,
    clientsError,
    clientsLoading,
    hasActiveFilters,
    loadClients,
    page,
    pagination,
    search,
    selectedClient,
    selectedClientId,
    setPage,
    setSearch,
    setSelectedClientId,
    setStatusFilter,
    statusFilter,
  };
}
