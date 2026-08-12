import { Router } from "express";
import { clientController } from "../controllers/client.controller.js";
import { noteController } from "../controllers/note.controller.js";
import { validateRequest } from "../middlewares/validate-request.js";
import {
  clientParamsSchema,
  createClientSchema,
  createNoteSchema,
  listClientsSchema,
  noteParamsSchema,
  patchClientSchema,
  replaceClientSchema,
  updateNoteSchema,
} from "../validators/client.validators.js";

export const clientRoutes = Router();

clientRoutes.get("/", validateRequest(listClientsSchema), clientController.list);
clientRoutes.post("/", validateRequest(createClientSchema), clientController.create);
clientRoutes.get("/:id", validateRequest(clientParamsSchema), clientController.getById);
clientRoutes.put("/:id", validateRequest(replaceClientSchema), clientController.replace);
clientRoutes.patch("/:id", validateRequest(patchClientSchema), clientController.patch);
clientRoutes.delete("/:id", validateRequest(clientParamsSchema), clientController.remove);

clientRoutes.get("/:id/notes", validateRequest(clientParamsSchema), noteController.list);
clientRoutes.post("/:id/notes", validateRequest(createNoteSchema), noteController.create);
clientRoutes.put(
  "/:id/notes/:noteId",
  validateRequest(updateNoteSchema),
  noteController.update,
);
clientRoutes.delete(
  "/:id/notes/:noteId",
  validateRequest(noteParamsSchema),
  noteController.remove,
);
