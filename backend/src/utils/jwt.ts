import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "./app-error.js";

export type AccessTokenUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export function signAccessToken(user: AccessTokenUser) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    subject: user.id,
  };

  return jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    options,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "USER")
    ) {
      throw new AppError(401, "Invalid authentication token.", "INVALID_TOKEN");
    }

    return {
      email: payload.email,
      role: payload.role,
      sub: payload.sub,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Invalid or expired authentication token.", "INVALID_TOKEN");
  }
}
