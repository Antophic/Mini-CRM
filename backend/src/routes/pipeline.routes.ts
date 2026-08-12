import { Router } from "express";
import { pipelineController } from "../controllers/pipeline.controller.js";

export const pipelineRoutes = Router();

pipelineRoutes.get("/stages", pipelineController.listStages);
