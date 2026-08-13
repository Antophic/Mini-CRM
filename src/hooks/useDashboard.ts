import { useCallback, useEffect, useMemo, useState } from "react";
import { getDashboard } from "../api/dashboard";
import { listPipelineStages } from "../api/pipeline";
import { emptyDashboard } from "../constants/crm";
import {
  statusOptions,
  type AuthUser,
  type DashboardMetrics,
  type LeadStatus,
  type PipelineStage,
} from "../types";
import { getErrorMessage } from "../utils/errors";

export function useDashboard(user: AuthUser | null) {
  const [dashboard, setDashboard] = useState<DashboardMetrics>(emptyDashboard);
  const [dashboardError, setDashboardError] = useState("");
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

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

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => {
        setDashboard(emptyDashboard);
        setDashboardError("");
        setPipelineStages([]);
      });
      return;
    }

    queueMicrotask(() => {
      void loadStages();
      void loadDashboard();
    });
  }, [loadDashboard, loadStages, user]);

  const availableStatuses = useMemo<readonly LeadStatus[]>(
    () => (pipelineStages.length ? pipelineStages.map((stage) => stage.label) : statusOptions),
    [pipelineStages],
  );

  return {
    availableStatuses,
    dashboard,
    dashboardError,
    loadDashboard,
    pipelineStages,
  };
}
