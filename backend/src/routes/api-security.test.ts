import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";

process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.DATABASE_URL = "mysql://root:password@localhost:3306/mini_crm_test";
process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const { app } = await import("../app.js");
const { prisma } = await import("../config/prisma.js");

async function request(path: string, init: RequestInit = {}) {
  const server = app.listen(0);
  const { port } = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, init);
    const body = (await response.json()) as {
      data?: unknown;
      error?: { code?: string };
      message?: string;
      success: boolean;
    };

    return {
      body,
      headers: response.headers,
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

async function hasIntegrationDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.user.count();
    return true;
  } catch {
    return false;
  }
}

function csrfJsonHeaders(cookie?: string) {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Protection": "1",
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

function sessionCookie(headers: Headers) {
  return headers.get("set-cookie")?.split(";")[0] ?? "";
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

test("client ownership prevents cross-user access", async (context) => {
  if (!(await hasIntegrationDatabase())) {
    context.skip("MySQL integration database is not available or migrated.");
    return;
  }

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const userAEmail = `owner-a-${suffix}@example.test`;
  const userBEmail = `owner-b-${suffix}@example.test`;

  context.after(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [userAEmail, userBEmail],
        },
      },
    });
  });

  const userA = await request("/api/auth/register", {
    body: JSON.stringify({
      email: userAEmail,
      name: "Owner A",
      password: "password123",
    }),
    headers: csrfJsonHeaders(),
    method: "POST",
  });
  const userB = await request("/api/auth/register", {
    body: JSON.stringify({
      email: userBEmail,
      name: "Owner B",
      password: "password123",
    }),
    headers: csrfJsonHeaders(),
    method: "POST",
  });
  const userACookie = sessionCookie(userA.headers);
  const userBCookie = sessionCookie(userB.headers);

  assert.equal(userA.status, 201);
  assert.equal(userB.status, 201);
  assert.ok(userACookie);
  assert.ok(userBCookie);

  const created = await request("/api/clients", {
    body: JSON.stringify({
      company: "Owner A Company",
      email: "client-a@example.test",
      name: "Client A",
      phone: "+1 555 0100",
      status: "New Lead",
      value: 2400,
    }),
    headers: csrfJsonHeaders(userACookie),
    method: "POST",
  });
  const clientId = (created.body.data as { client?: { id?: string } } | undefined)?.client?.id;

  assert.equal(created.status, 201);
  assert.ok(clientId);

  const crossUserGet = await request(`/api/clients/${clientId}`, {
    headers: {
      Cookie: userBCookie,
    },
  });
  const crossUserUpdate = await request(`/api/clients/${clientId}`, {
    body: JSON.stringify({
      company: "Blocked Company",
      email: "blocked@example.test",
      name: "Blocked Client",
      phone: "+1 555 0199",
      status: "Contacted",
      value: 999,
    }),
    headers: csrfJsonHeaders(userBCookie),
    method: "PUT",
  });
  const crossUserDelete = await request(`/api/clients/${clientId}`, {
    headers: csrfJsonHeaders(userBCookie),
    method: "DELETE",
  });
  const ownerGet = await request(`/api/clients/${clientId}`, {
    headers: {
      Cookie: userACookie,
    },
  });

  assert.ok([403, 404].includes(crossUserGet.status));
  assert.ok([403, 404].includes(crossUserUpdate.status));
  assert.ok([403, 404].includes(crossUserDelete.status));
  assert.equal(ownerGet.status, 200);
});
