import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { isProduction } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    message: issue.message,
    path: issue.path.join("."),
  }));
}

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  void _next;

  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        details: formatZodError(error),
      },
      message: "Invalid request data.",
      success: false,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        details: error.details,
      },
      message: error.message,
      success: false,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const conflictCodes = new Set(["P2002"]);
    const notFoundCodes = new Set(["P2025"]);
    const statusCode = conflictCodes.has(error.code)
      ? 409
      : notFoundCodes.has(error.code)
        ? 404
        : 500;

    res.status(statusCode).json({
      error: {
        code:
          statusCode === 409
            ? "RESOURCE_CONFLICT"
            : statusCode === 404
              ? "RESOURCE_NOT_FOUND"
              : "DATABASE_ERROR",
      },
      message:
        statusCode === 409
          ? "A resource with the same unique value already exists."
          : statusCode === 404
            ? "Resource not found."
            : "Unable to process the request.",
      success: false,
    });
    return;
  }

  if (!isProduction) {
    console.error(error);
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
    },
    message: "Unexpected server error.",
    success: false,
  });
}
