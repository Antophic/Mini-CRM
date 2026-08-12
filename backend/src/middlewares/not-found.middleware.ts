import type { Request, Response } from "express";

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
    },
    message: `Route ${req.method} ${req.originalUrl} was not found.`,
    success: false,
  });
}
