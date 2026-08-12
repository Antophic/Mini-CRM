import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema } from "./auth.validators.js";

test("register validation normalizes email and accepts a strong password", () => {
  const result = registerSchema.body.parse({
    email: "  USER@Example.COM ",
    name: "Sales User",
    password: "password123",
  });

  assert.equal(result.email, "user@example.com");
  assert.equal(result.name, "Sales User");
});

test("register validation rejects weak passwords", () => {
  assert.throws(() =>
    registerSchema.body.parse({
      email: "user@example.com",
      password: "short",
    }),
  );
});

test("login validation requires a password", () => {
  assert.throws(() =>
    loginSchema.body.parse({
      email: "user@example.com",
      password: "",
    }),
  );
});
