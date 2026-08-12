import type { AuthenticatedUser } from "../types/express.js";
import { getStageKeyFromInput } from "../constants/pipeline.js";
import { activityRepository } from "../repositories/activity.repository.js";
import { clientRepository } from "../repositories/client.repository.js";
import { noteRepository } from "../repositories/note.repository.js";
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
    const client = await clientRepository.create(actor, {
      company: input.company,
      email: input.email,
      name: input.name,
      phone: input.phone,
      stageKey: toStageKey(input.status),
      value: input.value,
    });

    if (input.note) {
      await noteRepository.create(client.id, actor, input.note);
    }

    await activityRepository.create({
      action: "CLIENT_CREATED",
      clientId: client.id,
      entity: "client",
      entityId: client.id,
      userId: user.id,
    });

    const reloaded = await clientRepository.findAuthorized(client.id, actor);
    return toClientDto(reloaded ?? client);
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
