import type { DashboardMetrics } from "../types";
import { apiRequest } from "./client";

export function getDashboard() {
  return apiRequest<{ dashboard: DashboardMetrics }>("/dashboard");
}
