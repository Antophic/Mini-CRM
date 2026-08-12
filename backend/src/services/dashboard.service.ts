import type { AuthenticatedUser } from "../types/express.js";
import { dashboardRepository } from "../repositories/dashboard.repository.js";
import { activityRepository } from "../repositories/activity.repository.js";
import { pipelineService } from "./pipeline.service.js";
import { toActivityDto } from "../utils/dto.js";

export const dashboardService = {
  async getDashboard(user: AuthenticatedUser) {
    const actor = {
      id: user.id,
      role: user.role,
    };
    const [summary, stages, activities] = await Promise.all([
      dashboardRepository.getSummary(actor),
      pipelineService.listStages(),
      activityRepository.findRecent(user.id, user.role),
    ]);
    const pipelineByStage = new Map(
      summary.pipeline.map((item) => [
        item.stageKey,
        {
          clients: item._count,
          value: Number(item._sum?.dealValue ?? 0),
        },
      ]),
    );

    return {
      active: summary.activeLeads,
      activeValue: summary.activeValue,
      closeRate: summary.closeRate,
      notes: summary.notes,
      pipeline: stages.map((stage) => ({
        ...stage,
        clients: pipelineByStage.get(stage.key)?.clients ?? 0,
        value: pipelineByStage.get(stage.key)?.value ?? 0,
      })),
      recentActivities: activities.map(toActivityDto),
      total: summary.totalClients,
      totalValue: summary.totalValue,
      won: summary.wonDeals,
    };
  },
};
