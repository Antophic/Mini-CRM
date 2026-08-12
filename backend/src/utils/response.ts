import type { Response } from "express";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200) {
  res.status(statusCode).json({
    data,
    success: true,
  });
}
