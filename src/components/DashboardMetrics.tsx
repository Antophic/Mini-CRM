import type { DashboardMetrics as DashboardMetricsData } from "../types";
import { formatCurrency } from "../utils/formatters";

type DashboardMetricsProps = {
  dashboard: DashboardMetricsData;
  error: string;
};

export function DashboardMetrics({ dashboard, error }: DashboardMetricsProps) {
  return (
    <>
      {error ? <p className="form-error">{error}</p> : null}

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
    </>
  );
}
