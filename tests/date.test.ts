import test from "node:test";
import assert from "node:assert/strict";
import { getMonthStartInTimezone } from "../lib/date";

test("monthly quota boundary starts at midnight in the shop timezone", () => {
  const instant = new Date("2026-11-30T18:00:00.000Z");

  assert.equal(getMonthStartInTimezone(instant, "Asia/Bangkok").toISOString(), "2026-11-30T17:00:00.000Z");
  assert.equal(getMonthStartInTimezone(instant, "America/Los_Angeles").toISOString(), "2026-11-01T07:00:00.000Z");
});

test("monthly quota boundary follows daylight saving time at the month start", () => {
  const instant = new Date("2026-04-15T12:00:00.000Z");
  assert.equal(getMonthStartInTimezone(instant, "America/Los_Angeles").toISOString(), "2026-04-01T07:00:00.000Z");
});
