import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (safeMethods.has(req.method)) {
    next();
    return;
  }

  if (req.header("x-csrf-protection") !== "1") {
    next(new AppError(403, "Missing CSRF protection header.", "CSRF_PROTECTION_REQUIRED"));
    return;
  }

  next();
}
