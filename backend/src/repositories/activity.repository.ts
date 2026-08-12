import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

type ActivityInput = {
  action: string;
  clientId?: string | null;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  userId: string;
};

export const activityRepository = {
  create(input: ActivityInput) {
    return prisma.activityLog.create({
      data: {
        action: input.action,
        clientId: input.clientId,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata,
        userId: input.userId,
      },
    });
  },

  findRecent(userId: string, role: "ADMIN" | "USER", limit = 10) {
    return prisma.activityLog.findMany({
      include: {
        client: {
          select: {
            company: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      where: role === "ADMIN" ? undefined : { userId },
    });
  },
};
