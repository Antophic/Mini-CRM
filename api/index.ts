import type { IncomingMessage, ServerResponse } from "node:http";

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url?.startsWith("/api/health")) {
    sendJson(res, 200, {
      data: {
        checks: {
          databaseUrl: Boolean(process.env.DATABASE_URL),
          jwtSecret: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32),
        },
        service: "mini-crm-api",
        status: "ok",
      },
      success: true,
    });
    return;
  }

  try {
    const { app } = await import("../backend/src/app.js");
    app(req, res);
  } catch (error) {
    const detail =
      error instanceof Error
        ? {
            message: error.message,
            name: error.name,
          }
        : {
            message: "Unknown backend boot error",
            name: "UnknownError",
          };

    console.error("Backend boot failed", detail);
    sendJson(res, 500, {
      error: {
        code: "BACKEND_BOOT_FAILED",
        detail,
      },
      message: "API failed to start.",
      success: false,
    });
  }
}
