import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

function getBearerToken(req: Request) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req) ?? req.cookies?.[env.COOKIE_NAME];

    if (!token) {
      throw new AppError(401, "Authentication is required.", "AUTH_REQUIRED");
    }

    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new AppError(401, "Authentication is required.", "AUTH_REQUIRED");
    }

    req.user = {
      email: user.email,
      id: user.id,
      role: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(roles: Array<"ADMIN" | "USER">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "Authentication is required.", "AUTH_REQUIRED"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "You do not have permission for this action.", "FORBIDDEN"));
      return;
    }

    next();
  };
}
