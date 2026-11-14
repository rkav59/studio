import assert from "node:assert/strict";
import test from "node:test";
import { BILLING_ENABLED } from "../src/lib/billing/feature-flags";

test("SHEiQpro defaults to free access while subscriptions are paused", () => {
  assert.equal(BILLING_ENABLED, false);
});
