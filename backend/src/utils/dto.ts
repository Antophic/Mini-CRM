import type {
  ActivityLog,
  Client,
  ClientNote,
  PipelineStage,
  User,
} from "@prisma/client";

type ClientWithRelations = Client & {
  notes?: ClientNote[];
  stage?: PipelineStage;
};

export function toUserDto(user: Pick<User, "id" | "email" | "name" | "role" | "createdAt">) {
  return {
    createdAt: user.createdAt.toISOString(),
    email: user.email,
    id: user.id,
    name: user.name ?? "",
    role: user.role,
  };
}

export function toNoteDto(note: ClientNote) {
  return {
    body: note.body,
    clientId: note.clientId,
    createdAt: note.createdAt.toISOString(),
    id: note.id,
    updatedAt: note.updatedAt.toISOString(),
    userId: note.userId,
  };
}

export function toClientDto(client: ClientWithRelations) {
  return {
    company: client.company,
    createdAt: client.createdAt.toISOString(),
    email: client.email ?? "",
    id: client.id,
    name: client.name,
    notes: (client.notes ?? []).map(toNoteDto),
    phone: client.phone ?? "",
    status: client.stage?.label ?? client.stageKey,
    updatedAt: client.updatedAt.toISOString(),
    userId: client.userId,
    value: Number(client.dealValue),
  };
}

export function toPipelineStageDto(stage: PipelineStage) {
  return {
    isClosed: stage.isClosed,
    isWon: stage.isWon,
    key: stage.key,
    label: stage.label,
    sortOrder: stage.sortOrder,
  };
}

export function toActivityDto(activity: ActivityLog & { client?: Pick<Client, "name" | "company"> | null }) {
  return {
    action: activity.action,
    client: activity.client
      ? {
          company: activity.client.company,
          name: activity.client.name,
        }
      : null,
    clientId: activity.clientId,
    createdAt: activity.createdAt.toISOString(),
    entity: activity.entity,
    entityId: activity.entityId,
    id: activity.id,
    metadata: activity.metadata,
    userId: activity.userId,
  };
}
