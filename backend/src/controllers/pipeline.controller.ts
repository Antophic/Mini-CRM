import type { Request, Response } from "express";
import { pipelineService } from "../services/pipeline.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";

export const pipelineController = {
  listStages: asyncHandler(async (_req: Request, res: Response) => {
    const stages = await pipelineService.listStages();
    sendSuccess(res, { stages });
  }),
};
