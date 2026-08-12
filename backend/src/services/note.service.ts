import type { AuthenticatedUser } from "../types/express.js";
import { activityRepository } from "../repositories/activity.repository.js";
import { clientRepository } from "../repositories/client.repository.js";
import { noteRepository } from "../repositories/note.repository.js";
import { AppError } from "../utils/app-error.js";
import { toNoteDto } from "../utils/dto.js";
import type { UpsertNoteInput } from "../validators/client.validators.js";

function actorFromUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    role: user.role,
  };
}

async function ensureClientAccess(clientId: string, user: AuthenticatedUser) {
  const client = await clientRepository.findAuthorized(clientId, actorFromUser(user));

  if (!client) {
    throw new AppError(404, "Client not found.", "CLIENT_NOT_FOUND");
  }

  return client;
}

export const noteService = {
  async create(clientId: string, input: UpsertNoteInput, user: AuthenticatedUser) {
    await ensureClientAccess(clientId, user);
    const note = await noteRepository.create(clientId, actorFromUser(user), input.body);

    await activityRepository.create({
      action: "NOTE_CREATED",
      clientId,
      entity: "client_note",
      entityId: note.id,
      userId: user.id,
    });

    return toNoteDto(note);
  },

  async list(clientId: string, user: AuthenticatedUser) {
    await ensureClientAccess(clientId, user);
    const notes = await noteRepository.findManyByClient(clientId, actorFromUser(user));

    return notes.map(toNoteDto);
  },

  async remove(clientId: string, noteId: string, user: AuthenticatedUser) {
    const note = await noteRepository.deleteAuthorized(clientId, noteId, actorFromUser(user));

    if (!note) {
      throw new AppError(404, "Note not found.", "NOTE_NOT_FOUND");
    }

    await activityRepository.create({
      action: "NOTE_DELETED",
      clientId,
      entity: "client_note",
      entityId: note.id,
      userId: user.id,
    });

    return toNoteDto(note);
  },

  async update(clientId: string, noteId: string, input: UpsertNoteInput, user: AuthenticatedUser) {
    const note = await noteRepository.updateAuthorized(
      clientId,
      noteId,
      actorFromUser(user),
      input.body,
    );

    if (!note) {
      throw new AppError(404, "Note not found.", "NOTE_NOT_FOUND");
    }

    await activityRepository.create({
      action: "NOTE_UPDATED",
      clientId,
      entity: "client_note",
      entityId: note.id,
      userId: user.id,
    });

    return toNoteDto(note);
  },
};
