import assert from "node:assert/strict";
import test from "node:test";
import {
  createClientSchema,
  listClientsSchema,
  patchClientSchema,
} from "./client.validators.js";

test("client validation accepts CRM input and coerces value", () => {
  const result = createClientSchema.body.parse({
    company: "Acme Consulting",
    email: "client@example.com",
    name: "Sarah Mitchell",
    phone: "",
    status: "Proposal",
    value: "12000",
  });

  assert.equal(result.value, 12000);
  assert.equal(result.phone, null);
});

test("client validation rejects invalid status", () => {
  assert.throws(() =>
    createClientSchema.body.parse({
      company: "Acme Consulting",
      name: "Sarah Mitchell",
      status: "Unknown",
      value: 1000,
    }),
  );
});

test("client list validation applies pagination defaults", () => {
  const result = listClientsSchema.query.parse({});

  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
  assert.equal(result.sortBy, "updatedAt");
});

test("client patch validation requires at least one field", () => {
  assert.throws(() => patchClientSchema.body.parse({}));
});
