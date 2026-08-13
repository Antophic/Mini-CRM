import type { DashboardMetrics, Pagination } from "../types";

export const emptyDashboard: DashboardMetrics = {
  active: 0,
  activeValue: 0,
  closeRate: 0,
  notes: 0,
  pipeline: [],
  total: 0,
  totalValue: 0,
  won: 0,
};

export const initialPagination: Pagination = {
  limit: 10,
  page: 1,
  total: 0,
  totalPages: 1,
};
