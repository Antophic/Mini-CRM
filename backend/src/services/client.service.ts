import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import type { AuthenticatedUser } from "../types/express.js";
import { getStageKeyFromInput } from "../constants/pipeline.js";
import { activityRepository } from "../repositories/activity.repository.js";
import { clientRepository } from "../repositories/client.repository.js";
import { AppError } from "../utils/app-error.js";
import { toClientDto } from "../utils/dto.js";
import type {
  CreateClientInput,
  ListClientsQuery,
  PatchClientInput,
  ReplaceClientInput,
} from "../validators/client.validators.js";

function toStageKey(status: string) {
  const stageKey = getStageKeyFromInput(status);

  if (!stageKey) {
    throw new AppError(400, "Choose a valid pipeline status.", "INVALID_STATUS");
  }

  return stageKey;
}

function actorFromUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    role: user.role,
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

async function updateClientRecord(
  id: string,
  input: PatchClientInput | ReplaceClientInput,
  user: AuthenticatedUser,
) {
  const client = await clientRepository.updateAuthorized(id, actorFromUser(user), {
    company: input.company,
    email: input.email,
    name: input.name,
    phone: input.phone,
    stageKey: input.status ? toStageKey(input.status) : undefined,
    value: input.value,
  });

  if (!client) {
    throw new AppError(404, "Client not found.", "CLIENT_NOT_FOUND");
  }

  await activityRepository.create({
    action: "CLIENT_UPDATED",
    clientId: client.id,
    entity: "client",
    entityId: client.id,
    userId: user.id,
  });

  return toClientDto(client);
}

export const clientService = {
  async create(input: CreateClientInput, user: AuthenticatedUser) {
    const actor = actorFromUser(user);
    const stageKey = toStageKey(input.status);

    const client = await prisma.$transaction(async (tx) => {
      const createdClient = await tx.client.create({
        data: {
          company: input.company,
          dealValue: input.value,
          email: input.email ?? null,
          name: input.name,
          phone: input.phone ?? null,
          stageKey,
          userId: actor.id,
        },
        include: clientInclude(),
      });

      if (input.note) {
        await tx.clientNote.create({
          data: {
            body: input.note,
            clientId: createdClient.id,
            userId: actor.id,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          action: "CLIENT_CREATED",
          clientId: createdClient.id,
          entity: "client",
          entityId: createdClient.id,
          userId: user.id,
        },
      });

      return tx.client.findUniqueOrThrow({
        include: clientInclude(),
        where: {
          id: createdClient.id,
        },
      });
    });

    return toClientDto(client);
  },

  async getById(id: string, user: AuthenticatedUser) {
    const client = await clientRepository.findAuthorized(id, actorFromUser(user));

    if (!client) {
      throw new AppError(404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    return toClientDto(client);
  },

  async list(query: ListClientsQuery, user: AuthenticatedUser) {
    const actor = actorFromUser(user);
    const stageKey = query.status ? toStageKey(query.status) : undefined;
    const [clients, total] = await Promise.all([
      clientRepository.findMany({
        actor,
        limit: query.limit,
        order: query.order,
        page: query.page,
        search: query.search,
        sortBy: query.sortBy,
        stageKey,
      }),
      clientRepository.count({
        actor,
        search: query.search,
        stageKey,
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / query.limit));

    return {
      clients: clients.map(toClientDto),
      pagination: {
        limit: query.limit,
        page: query.page,
        total,
        totalPages,
      },
    };
  },

  async patch(id: string, input: PatchClientInput, user: AuthenticatedUser) {
    return updateClientRecord(id, input, user);
  },

  async remove(id: string, user: AuthenticatedUser) {
    const client = await clientRepository.deleteAuthorized(id, actorFromUser(user));

    if (!client) {
      throw new AppError(404, "Client not found.", "CLIENT_NOT_FOUND");
    }

    await activityRepository.create({
      action: "CLIENT_DELETED",
      entity: "client",
      entityId: id,
      userId: user.id,
    });

    return toClientDto(client);
  },

  async replace(id: string, input: ReplaceClientInput, user: AuthenticatedUser) {
    return updateClientRecord(id, input, user);
  },
};
