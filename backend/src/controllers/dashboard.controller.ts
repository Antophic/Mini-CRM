import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

export const dashboardController = {
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    const dashboard = await dashboardService.getDashboard(req.user!);
    sendSuccess(res, { dashboard });
  }),
};
