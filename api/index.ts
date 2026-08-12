import type { IncomingMessage, ServerResponse } from "node:http";

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function isHealthRequest(req: IncomingMessage) {
  return req.url?.startsWith("/api/health") ?? false;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (isHealthRequest(req)) {
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
    console.error("Backend boot failed", error);
    sendJson(res, 500, {
      error: {
        code: "BACKEND_BOOT_FAILED",
      },
      message: "API failed to start. Check deployment logs and environment variables.",
      success: false,
    });
  }
}
