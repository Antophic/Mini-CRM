import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

type Actor = {
  id: string;
  role: "ADMIN" | "USER";
};

function ownerWhere(actor: Actor): Prisma.ClientWhereInput {
  return actor.role === "ADMIN" ? {} : { userId: actor.id };
}

export const dashboardRepository = {
  async getSummary(actor: Actor) {
    const where = ownerWhere(actor);
    const activeWhere = {
      ...where,
      stage: {
        isClosed: false,
      },
    } satisfies Prisma.ClientWhereInput;
    const wonWhere = {
      ...where,
      stage: {
        isWon: true,
      },
    } satisfies Prisma.ClientWhereInput;
    const lostWhere = {
      ...where,
      stageKey: "lost",
    } satisfies Prisma.ClientWhereInput;

    const [
      totalClients,
      activeLeads,
      wonDeals,
      lostDeals,
      activeValue,
      totalValue,
      notes,
      pipeline,
    ] = await prisma.$transaction([
      prisma.client.count({ where }),
      prisma.client.count({ where: activeWhere }),
      prisma.client.count({ where: wonWhere }),
      prisma.client.count({ where: lostWhere }),
      prisma.client.aggregate({
        _sum: { dealValue: true },
        where: activeWhere,
      }),
      prisma.client.aggregate({
        _sum: { dealValue: true },
        where,
      }),
      prisma.clientNote.count({
        where: actor.role === "ADMIN" ? undefined : { client: { userId: actor.id } },
      }),
      prisma.client.groupBy({
        _count: true,
        _sum: {
          dealValue: true,
        },
        by: ["stageKey"],
        orderBy: {
          stageKey: "asc",
        },
        where,
      }),
    ]);

    return {
      activeLeads,
      activeValue: Number(activeValue._sum.dealValue ?? 0),
      closeRate:
        wonDeals + lostDeals > 0
          ? Math.round((wonDeals / (wonDeals + lostDeals)) * 100)
          : 0,
      notes,
      pipeline,
      totalClients,
      totalValue: Number(totalValue._sum.dealValue ?? 0),
      wonDeals,
    };
  },
};
