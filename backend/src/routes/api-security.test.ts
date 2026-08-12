import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.DATABASE_URL = "mysql://root:password@localhost:3306/mini_crm_test";
process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const { app } = await import("../app.js");

async function request(path: string, init: RequestInit = {}) {
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, init);
    const body = (await response.json()) as {
      error?: { code?: string };
      message?: string;
      success: boolean;
    };

    return {
      body,
      status: response.status,
    };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

test("health endpoint is public", async () => {
  const response = await request("/api/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test("protected client route rejects missing authentication", async () => {
  const response = await request("/api/clients");

  assert.equal(response.status, 401);
  assert.equal(response.body.error?.code, "AUTH_REQUIRED");
});

test("mutating requests require CSRF protection header", async () => {
  const response = await request("/api/clients", {
    body: JSON.stringify({}),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  assert.equal(response.status, 403);
  assert.equal(response.body.error?.code, "CSRF_PROTECTION_REQUIRED");
});

test("auth register validates invalid input before creating users", async () => {
  const response = await request("/api/auth/register", {
    body: JSON.stringify({
      email: "not-an-email",
      password: "short",
    }),
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Protection": "1",
    },
    method: "POST",
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error?.code, "VALIDATION_ERROR");
});

test("unknown routes return a consistent 404 response", async () => {
  const response = await request("/api/missing-route");

  assert.equal(response.status, 404);
  assert.equal(response.body.error?.code, "ROUTE_NOT_FOUND");
});
