import assert from "node:assert/strict";
import test from "node:test";
import { callbackError, googleCallbackUrl, postSignInPath } from "../src/lib/auth/google-oauth";

test("Google redirects to the same-origin callback", () => {
  assert.equal(googleCallbackUrl("https://sheiqpro.com"), "https://sheiqpro.com/auth/callback");
  assert.equal(googleCallbackUrl("http://localhost:9002"), "http://localhost:9002/auth/callback");
});

test("provider errors are detected in query or fragment", () => {
  assert.equal(callbackError("?error=access_denied", ""), true);
  assert.equal(callbackError("", "#error=server_error&error_code=400"), true);
  assert.equal(callbackError("?code=example", ""), false);
});

test("pending invitations keep their token after Google sign in", () => {
  assert.equal(postSignInPath(null), "/dashboard");
  assert.equal(postSignInPath("a&b"), "/join?token=a%26b");
});
