import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

type Actor = {
  id: string;
  role: "ADMIN" | "USER";
};

function noteOwnerWhere(actor: Actor): Prisma.ClientNoteWhereInput {
  return actor.role === "ADMIN"
    ? {}
    : {
        client: {
          userId: actor.id,
        },
      };
}

export const noteRepository = {
  create(clientId: string, actor: Actor, body: string) {
    return prisma.clientNote.create({
      data: {
        body,
        clientId,
        userId: actor.id,
      },
    });
  },

  async deleteAuthorized(clientId: string, noteId: string, actor: Actor) {
    const note = await this.findAuthorized(clientId, noteId, actor);

    if (!note) {
      return null;
    }

    await prisma.clientNote.delete({
      where: { id: note.id },
    });

    return note;
  },

  findAuthorized(clientId: string, noteId: string, actor: Actor) {
    return prisma.clientNote.findFirst({
      where: {
        clientId,
        id: noteId,
        ...noteOwnerWhere(actor),
      },
    });
  },

  findManyByClient(clientId: string, actor: Actor) {
    return prisma.clientNote.findMany({
      orderBy: {
        createdAt: "desc",
      },
      where: {
        clientId,
        ...noteOwnerWhere(actor),
      },
    });
  },

  async updateAuthorized(clientId: string, noteId: string, actor: Actor, body: string) {
    const note = await this.findAuthorized(clientId, noteId, actor);

    if (!note) {
      return null;
    }

    return prisma.clientNote.update({
      data: {
        body,
      },
      where: {
        id: note.id,
      },
    });
  },
};
