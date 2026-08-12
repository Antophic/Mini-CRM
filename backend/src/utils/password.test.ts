import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password.js";

test("password hashing does not store plaintext and can verify matches", async () => {
  const hash = await hashPassword("password123");

  assert.notEqual(hash, "password123");
  assert.equal(await verifyPassword("password123", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});
