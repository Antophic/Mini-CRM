import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

type Actor = {
  id: string;
  role: "ADMIN" | "USER";
};

type ClientListInput = {
  actor: Actor;
  limit: number;
  order: "asc" | "desc";
  page: number;
  search?: string;
  sortBy: "createdAt" | "updatedAt" | "name" | "company" | "status" | "value";
  stageKey?: string;
};

type ClientWriteInput = {
  company: string;
  email?: string | null;
  name: string;
  phone?: string | null;
  stageKey: string;
  value: number;
};

function ownerWhere(actor: Actor): Prisma.ClientWhereInput {
  return actor.role === "ADMIN" ? {} : { userId: actor.id };
}

function buildSearchWhere(search?: string): Prisma.ClientWhereInput {
  if (!search) {
    return {};
  }

  return {
    OR: [
      { name: { contains: search } },
      { company: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      {
        notes: {
          some: {
            body: { contains: search },
          },
        },
      },
    ],
  };
}

function buildOrderBy(
  sortBy: ClientListInput["sortBy"],
  order: ClientListInput["order"],
): Prisma.ClientOrderByWithRelationInput {
  const sortMap = {
    company: "company",
    createdAt: "createdAt",
    name: "name",
    status: "stageKey",
    updatedAt: "updatedAt",
    value: "dealValue",
  } as const;

  return {
    [sortMap[sortBy]]: order,
  };
}

function clientInclude() {
  return {
    notes: {
      orderBy: {
        createdAt: "desc",
      },
    },
    stage: true,
  } satisfies Prisma.ClientInclude;
}

export const clientRepository = {
  async count(input: Omit<ClientListInput, "limit" | "page" | "sortBy" | "order">) {
    return prisma.client.count({
      where: {
        AND: [
          ownerWhere(input.actor),
          buildSearchWhere(input.search),
          input.stageKey ? { stageKey: input.stageKey } : {},
        ],
      },
    });
  },

  async create(actor: Actor, input: ClientWriteInput) {
    return prisma.client.create({
      data: {
        company: input.company,
        dealValue: input.value,
        email: input.email ?? null,
        name: input.name,
        phone: input.phone ?? null,
        stageKey: input.stageKey,
        userId: actor.id,
      },
      include: clientInclude(),
    });
  },

  async deleteAuthorized(id: string, actor: Actor) {
    const client = await this.findAuthorized(id, actor);

    if (!client) {
      return null;
    }

    await prisma.client.delete({
      where: { id },
    });

    return client;
  },

  findAuthorized(id: string, actor: Actor) {
    return prisma.client.findFirst({
      include: clientInclude(),
      where: {
        id,
        ...ownerWhere(actor),
      },
    });
  },

  async findMany(input: ClientListInput) {
    const skip = (input.page - 1) * input.limit;

    return prisma.client.findMany({
      include: clientInclude(),
      orderBy: buildOrderBy(input.sortBy, input.order),
      skip,
      take: input.limit,
      where: {
        AND: [
          ownerWhere(input.actor),
          buildSearchWhere(input.search),
          input.stageKey ? { stageKey: input.stageKey } : {},
        ],
      },
    });
  },

  async updateAuthorized(id: string, actor: Actor, input: Partial<ClientWriteInput>) {
    const client = await this.findAuthorized(id, actor);

    if (!client) {
      return null;
    }

    return prisma.client.update({
      data: {
        company: input.company,
        dealValue: input.value,
        email: input.email,
        name: input.name,
        phone: input.phone,
        stageKey: input.stageKey,
      },
      include: clientInclude(),
      where: {
        id,
      },
    });
  },
};
