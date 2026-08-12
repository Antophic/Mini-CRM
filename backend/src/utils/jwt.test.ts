import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL = "mysql://root:password@localhost:3306/mini_crm_test";
process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const { signAccessToken, verifyAccessToken } = await import("./jwt.js");

test("jwt utility signs and verifies an access token", () => {
  const token = signAccessToken({
    email: "user@example.com",
    id: "user_1",
    role: "USER",
  });
  const payload = verifyAccessToken(token);

  assert.equal(payload.sub, "user_1");
  assert.equal(payload.email, "user@example.com");
  assert.equal(payload.role, "USER");
});

test("jwt utility rejects invalid tokens", () => {
  assert.throws(() => verifyAccessToken("not-a-token"));
});
