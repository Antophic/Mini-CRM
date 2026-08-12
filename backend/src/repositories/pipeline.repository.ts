import { prisma } from "../config/prisma.js";

export const pipelineRepository = {
  findAll() {
    return prisma.pipelineStage.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    });
  },
};
