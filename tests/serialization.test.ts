import { test } from "node:test";
import assert from "node:assert/strict";
import {
  encode,
  decode,
  Timestamp,
  toIso,
} from "../src/lib/supabase/serialization";
test("nested dates survive JSONB round trips without changing ordinary strings", () => {
  const iso = "2026-11-10T12:00:00.000Z";
  const input = {
    timestamp: Timestamp.fromDate(new Date(iso)),
    plain: iso,
    controls: [{ dueDate: new Date(iso), status: "Open" }],
    optional: undefined,
    nullable: null,
  };
  const result = decode(JSON.parse(JSON.stringify(encode(input))));
  assert.ok(result.timestamp instanceof Timestamp);
  assert.equal(result.timestamp.toDate().toISOString(), iso);
  assert.equal(result.plain, iso);
  assert.equal(result.controls[0].dueDate.toDate().toISOString(), iso);
  assert.equal(result.nullable, null);
  assert.equal("optional" in result, false);
});
test("date displays accept ISO strings as well as timestamps after edits", () => {
  const iso = "2026-11-10T12:00:00.000Z";
  assert.equal(toIso(iso), iso);
  assert.equal(toIso(Timestamp.fromDate(new Date(iso))), iso);
  assert.equal(toIso(new Date(iso)), iso);
  assert.equal(toIso(null), "");
  assert.throws(() => new Timestamp("not a date"));
});
