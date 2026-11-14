import assert from "node:assert/strict";
import test from "node:test";
import { GEMINI_MODEL, geminiConfigured } from "../src/ai/model-config";

test("all SHEiQpro Gemini flows share a supported provider configuration", () => {
  assert.equal(GEMINI_MODEL, "googleai/gemini-2.5-flash-lite");
});

test("Gemini readiness is a boolean without exposing credentials", () => {
  assert.equal(typeof geminiConfigured(), "boolean");
});
