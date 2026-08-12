import type { Request } from "express";
import { AppError } from "./app-error.js";

export function getRequiredParam(req: Request, name: string) {
  const value = req.params[name];

  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(400, `Missing route parameter: ${name}.`, "INVALID_ROUTE_PARAM");
  }

  return value;
}
