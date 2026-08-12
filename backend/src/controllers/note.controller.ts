import type { Request, Response } from "express";
import { noteService } from "../services/note.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRequiredParam } from "../utils/request.js";
import { sendSuccess } from "../utils/response.js";
import type { UpsertNoteInput } from "../validators/client.validators.js";

export const noteController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.create(
      getRequiredParam(req, "id"),
      req.body as UpsertNoteInput,
      req.user!,
    );
    sendSuccess(res, { note }, 201);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const notes = await noteService.list(getRequiredParam(req, "id"), req.user!);
    sendSuccess(res, { notes });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.remove(
      getRequiredParam(req, "id"),
      getRequiredParam(req, "noteId"),
      req.user!,
    );
    sendSuccess(res, { note });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const note = await noteService.update(
      getRequiredParam(req, "id"),
      getRequiredParam(req, "noteId"),
      req.body as UpsertNoteInput,
      req.user!,
    );
    sendSuccess(res, { note });
  }),
};
