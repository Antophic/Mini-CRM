import { z } from "zod";
import { getStageKeyFromInput } from "../constants/pipeline.js";

function requiredString(max: number, message: string) {
  return z.string().trim().min(1, message).max(max);
}

function optionalQueryString(max: number) {
  return z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return undefined;
    }

    return value;
  }, z.string().trim().max(max).optional());
}

function optionalNullableString(max: number) {
  return z.preprocess((value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }

    return value;
  }, z.string().trim().max(max).nullable().optional());
}

const statusSchema = z
  .string()
  .trim()
  .refine((value) => Boolean(getStageKeyFromInput(value)), {
    message: "Choose a valid pipeline status.",
  });

const emailSchema = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
}, z.string().trim().email("Enter a valid email address.").max(255).nullable().optional());

const clientBody = {
  company: requiredString(160, "Company is required."),
  email: emailSchema,
  name: requiredString(120, "Client name is required."),
  phone: optionalNullableString(40),
  status: statusSchema.default("New Lead"),
  value: z.coerce.number().finite().nonnegative().default(0),
};

export const clientIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export const noteIdParamsSchema = clientIdParamsSchema.extend({
  noteId: z.string().trim().min(1),
});

export const listClientsSchema = {
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    order: z.enum(["asc", "desc"]).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    search: optionalQueryString(100),
    sortBy: z
      .enum(["createdAt", "updatedAt", "name", "company", "status", "value"])
      .default("updatedAt"),
    status: z.preprocess((value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      return value === "All" || value.trim() === "" ? undefined : value;
    }, statusSchema.optional()),
  }),
};

export const clientParamsSchema = {
  params: clientIdParamsSchema,
};

export const createClientSchema = {
  body: z.object({
    ...clientBody,
    note: optionalNullableString(2000),
  }),
};

export const replaceClientSchema = {
  body: z.object(clientBody),
  params: clientIdParamsSchema,
};

export const patchClientSchema = {
  body: z
    .object({
      company: requiredString(160, "Company is required.").optional(),
      email: emailSchema,
      name: requiredString(120, "Client name is required.").optional(),
      phone: optionalNullableString(40),
      status: statusSchema.optional(),
      value: z.coerce.number().finite().nonnegative().optional(),
    })
    .refine((value) => Object.values(value).some((field) => field !== undefined), {
      message: "Provide at least one field to update.",
    }),
  params: clientIdParamsSchema,
};

export const notesParamsSchema = {
  params: clientIdParamsSchema,
};

export const noteParamsSchema = {
  params: noteIdParamsSchema,
};

export const createNoteSchema = {
  body: z.object({
    body: requiredString(2000, "Note body is required."),
  }),
  params: clientIdParamsSchema,
};

export const updateNoteSchema = {
  body: z.object({
    body: requiredString(2000, "Note body is required."),
  }),
  params: noteIdParamsSchema,
};

export type CreateClientInput = z.infer<typeof createClientSchema.body>;
export type ListClientsQuery = z.infer<typeof listClientsSchema.query>;
export type PatchClientInput = z.infer<typeof patchClientSchema.body>;
export type ReplaceClientInput = z.infer<typeof replaceClientSchema.body>;
export type UpsertNoteInput = z.infer<typeof createNoteSchema.body>;
