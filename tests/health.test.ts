import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "../app/api/health/route";
import { createTestDatabase } from "./test-helper";

test("health endpoint checks the database and disables caching", async () => {
  const db = await createTestDatabase("health");
  (global as any).prisma = db.prisma;
  try {
    const response = await GET();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal((await response.json()).status, "ok");
  } finally {
    await db.cleanup();
    delete (global as any).prisma;
  }
});

test("health endpoint reports a failed database probe without exposing internals", async () => {
  (global as any).prisma = { $queryRaw: async () => { throw new Error("private connection detail"); } };
  try {
    const response = await GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { status: "unavailable", service: "sunfzenith-queue-saas" });
  } finally {
    delete (global as any).prisma;
  }
});
