import type { Request, Response } from "express";
import { clientService } from "../services/client.service.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getRequiredParam } from "../utils/request.js";
import { sendSuccess } from "../utils/response.js";
import type {
  CreateClientInput,
  ListClientsQuery,
  PatchClientInput,
  ReplaceClientInput,
} from "../validators/client.validators.js";

export const clientController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.create(req.body as CreateClientInput, req.user!);
    sendSuccess(res, { client }, 201);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.getById(getRequiredParam(req, "id"), req.user!);
    sendSuccess(res, { client });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await clientService.list(req.query as unknown as ListClientsQuery, req.user!);
    sendSuccess(res, result);
  }),

  patch: asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.patch(
      getRequiredParam(req, "id"),
      req.body as PatchClientInput,
      req.user!,
    );
    sendSuccess(res, { client });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.remove(getRequiredParam(req, "id"), req.user!);
    sendSuccess(res, { client });
  }),

  replace: asyncHandler(async (req: Request, res: Response) => {
    const client = await clientService.replace(
      getRequiredParam(req, "id"),
      req.body as ReplaceClientInput,
      req.user!,
    );
    sendSuccess(res, { client });
  }),
};
