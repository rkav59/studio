import assert from "node:assert/strict";
import test from "node:test";
import { GEMINI_MODEL, geminiConfigured } from "../src/ai/model-config";

test("all SHEiQpro Gemini flows share a supported provider configuration", () => {
  assert.match(GEMINI_MODEL, /^googleai\/gemini-/);
  assert.notEqual(GEMINI_MODEL, "googleai/gemini-2.0-flash");
});

test("Gemini readiness is a boolean without exposing credentials", () => {
  assert.equal(typeof geminiConfigured(), "boolean");
});
