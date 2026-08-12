import type { PipelineStage } from "../types";
import { apiRequest } from "./client";

export function listPipelineStages() {
  return apiRequest<{ stages: PipelineStage[] }>("/pipeline/stages");
}
