import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "../src/lib/supabase/records";
import { Timestamp } from "../src/lib/supabase/serialization";
function database(rpc: (name: string, args: any) => Promise<any>) {
  return { client: { rpc } as unknown as SupabaseClient };
}
test("record reads paginate beyond API limits and preserve sorting/filter arguments", async () => {
  const calls: any[] = [];
  const db = database(async (name, args) => {
    calls.push({ name, args });
    return {
      error: null,
      data: Array.from(
        { length: args.page_offset === 0 ? 500 : 2 },
        (_, i) => ({
          id: String(args.page_offset + i),
          data: {
            timestamp: { __sheiq_timestamp: "2026-11-10T12:00:00.000Z" },
          },
        }),
      ),
    };
  });
  const result = await getDocs(
    query(
      collection(db, "incidents"),
      where("userId", "==", "alice"),
      orderBy("timestamp", "desc"),
    ),
  );
  assert.equal(result.size, 502);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].args.page_offset, 500);
  assert.equal(calls[0].args.filters[0].value, "alice");
  assert.equal(calls[0].args.ordering[0].direction, "desc");
  assert.ok(result.docs[0].data().timestamp instanceof Timestamp);
});
test("write modes and errors are preserved by the Supabase record API", async () => {
  const calls: any[] = [];
  const db = database(async (name, args) => {
    calls.push({ name, args });
    return { error: null, data: null };
  });
  const ref = doc(db, "incidents", "a");
  assert.equal((await getDoc(ref)).exists(), false);
  await addDoc(collection(db, "incidents"), { value: 1 });
  await setDoc(ref, { value: 2 });
  await setDoc(ref, { value: 3 }, { merge: true });
  await updateDoc(ref, { value: 4 });
  await deleteDoc(ref);
  assert.deepEqual(
    calls
      .filter((c) => c.name === "write_record")
      .map((c) => c.args.write_mode),
    ["create", "replace", "merge", "update"],
  );
  const failing = database(async () => ({
    error: new Error("Permission denied"),
    data: null,
  }));
  await assert.rejects(
    getDocs(collection(failing, "incidents")),
    /Permission denied/,
  );
  await assert.rejects(
    updateDoc(doc(failing, "incidents", "a"), {}),
    /Permission denied/,
  );
});
