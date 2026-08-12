import { pipelineStages } from "../constants/pipeline.js";
import { pipelineRepository } from "../repositories/pipeline.repository.js";
import { toPipelineStageDto } from "../utils/dto.js";

export const pipelineService = {
  async listStages() {
    const stages = await pipelineRepository.findAll();

    if (stages.length === 0) {
      return pipelineStages.map((stage) => ({
        isClosed: stage.isClosed,
        isWon: stage.isWon,
        key: stage.key,
        label: stage.label,
        sortOrder: stage.sortOrder,
      }));
    }

    return stages.map(toPipelineStageDto);
  },
};
