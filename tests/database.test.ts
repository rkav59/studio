import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
const charlie = "33333333-3333-4333-8333-333333333333";
async function asUser<T>(id: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`,
  );
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function scalar(sql: string, params: any[] = []) {
  return (await db.query<any>(sql, params)).rows[0]?.value;
}
before(async () => {
  await db.exec(`create role anon; create role authenticated;
 create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,storage to authenticated;grant execute on function auth.uid() to authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;
 grant select,insert,delete on storage.objects to authenticated;
 create function storage.foldername(name text) returns text[] language sql immutable as $$select string_to_array(name,'/')$$;`);
  for (const migration of readdirSync("supabase/migrations").filter(name => name.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(`supabase/migrations/${migration}`, "utf8"));
  }
  await db.query(
    `insert into auth.users(id,email,raw_user_meta_data,email_confirmed_at) values ($1,'alice@example.com','{"displayName":"Alice","role":"visitor"}',now()),($2,'bob@example.com','{}',now()),($3,'charlie@example.com','{}',now())`,
    [alice, bob, charlie],
  );
});
after(() => db.close());
test("signup creates organisation/profile and ignores role metadata", async () => {
  const rows = await db.query<any>("select * from public.profiles");
  assert.equal(rows.rows.length, 3);
  assert.equal(new Set(rows.rows.map((p) => p.organization_id)).size, 3);
  assert.equal(rows.rows.find((p) => p.id === alice)?.role, "admin");
});
test("unauthenticated RPC and table access are denied", async () => {
  await db.exec("set role anon");
  try {
    await assert.rejects(
      db.query("select public.read_record('incidents','a')"),
    );
    await assert.rejects(db.query("select * from public.app_records"));
  } finally {
    await db.exec("reset role");
  }
});
test("CRUD preserves nested timestamp payloads and merges atomically", async () =>
  asUser(alice, async () => {
    const payload = {
      userId: alice,
      description: "Initial",
      timestamp: { __sheiq_timestamp: "2026-11-10T12:00:00.000Z" },
      actions: [{ done: false }],
    };
    await db.query("select public.write_record('incidents','a',$1,'create')", [
      JSON.stringify(payload),
    ]);
    await db.query(
      "select public.write_record('incidents','a','{\"description\":\"Updated\"}','update')",
    );
    const value = await scalar(
      "select public.read_record('incidents','a') as value",
    );
    assert.equal(value.description, "Updated");
    assert.deepEqual(value.actions, [{ done: false }]);
    assert.equal(value.userId, alice);
    await assert.rejects(
      db.query(
        "select public.write_record('incidents','missing','{}','update')",
      ),
    );
    await assert.rejects(
      db.query("select public.write_record('incidents','a','{}','create')"),
    );
  }));
test("other organisations cannot read or overwrite another user records", async () =>
  asUser(bob, async () => {
    assert.equal(
      await scalar("select public.read_record('incidents','a') as value"),
      null,
    );
    await assert.rejects(
      db.query("select public.write_record('incidents','a','{}','replace')"),
    );
    await assert.rejects(
      db.query("select public.delete_record('incidents','a')"),
    );
    await assert.rejects(
      db.query("select public.write_record('incidents','spoof',$1,'create')", [
        JSON.stringify({ userId: alice }),
      ]),
    );
    assert.equal(
      (await db.query("select * from public.app_records")).rows.length,
      0,
    );
  }));
test("query filters compare timestamps, booleans, numbers and in lists", async () =>
  asUser(alice, async () => {
    for (let i = 0; i < 3; i++)
      await db.query("select public.write_record('incidents',$1,$2,'create')", [
        "filter" + i,
        JSON.stringify({
          status: i === 0 ? "Closed" : "Open",
          score: i,
          enabled: i > 0,
          timestamp: { __sheiq_timestamp: `2026-11-${11 + i}T12:00:00.000Z` },
        }),
      ]);
    const rows = await db.query<any>(
      "select * from public.list_records('incidents',$1,$2,0,500)",
      [
        JSON.stringify([
          { field: "status", op: "in", value: ["Open"] },
          { field: "score", op: ">=", value: 1 },
          { field: "enabled", op: "==", value: true },
          {
            field: "timestamp",
            op: ">=",
            value: { __sheiq_timestamp: "2026-11-12T00:00:00.000Z" },
          },
        ]),
        JSON.stringify([{ field: "score", direction: "desc" }]),
      ],
    );
    assert.deepEqual(
      rows.rows.map((r) => r.id),
      ["filter2", "filter1"],
    );
    assert.equal(
      (
        await db.query(
          "select * from public.list_records('incidents','[]','[]',1,1)",
        )
      ).rows.length,
      1,
    );
  }));
test("profiles cannot self-promote or change membership through JSON payload", async () =>
  asUser(alice, async () => {
    for (const payload of [
      { role: "admin" },
      { organizationId: "spoof" },
      { planId: "enterprise" },
    ])
      await assert.rejects(
        db.query("select public.write_record('userProfiles',$1,$2,'update')", [
          alice,
          JSON.stringify(payload),
        ]),
      );
    await db.query(
      "select public.write_record('userProfiles',$1,'{\"displayName\":\"Updated Alice\"}','merge')",
      [alice],
    );
    assert.equal(
      (
        await scalar("select public.read_record('userProfiles',$1) as value", [
          alice,
        ])
      ).displayName,
      "Updated Alice",
    );
  }));
test("invitation binds verified email and role, expires and is single use", async () => {
  const token = await asUser(alice, () =>
    scalar(
      "select public.create_invitation('bob@example.com','she_rep') as value",
    ),
  );
  await asUser(charlie, () =>
    assert.rejects(db.query("select public.accept_invitation($1)", [token])),
  );
  await asUser(bob, () =>
    db.query("select public.accept_invitation($1)", [token]),
  );
  await asUser(bob, () =>
    assert.rejects(db.query("select public.accept_invitation($1)", [token])),
  );
  const profile = (
    await db.query<any>("select * from public.profiles where id=$1", [bob])
  ).rows[0];
  assert.equal(profile.role, "she_rep");
  await asUser(bob, async () => {
    assert.equal(
      await scalar("select public.read_record('incidents','a') as value"),
      null,
    );
    await assert.rejects(
      db.query(
        "select public.write_record('medicalTestRecords','restricted','{}','create')",
      ),
    );
    await db.query("select public.write_record('incidents','b','{}','create')");
    await assert.rejects(
      db.query("select public.create_invitation('c@example.com','admin')"),
    );
  });
  const exp = await asUser(alice, () =>
    scalar(
      "select public.create_invitation('charlie@example.com','visitor') as value",
    ),
  );
  await db.exec(
    "update public.organization_invitations set expires_at=now()-interval '1 day' where email='charlie@example.com'",
  );
  await asUser(charlie, () =>
    assert.rejects(db.query("select public.accept_invitation($1)", [exp])),
  );
});
test("administrator can manage colleagues but cannot remove self; removed users lose access", async () => {
  await asUser(alice, async () => {
    await assert.rejects(
      db.query("select public.delete_record('userProfiles',$1)", [alice]),
    );
    await db.query(
      "select public.write_record('userProfiles',$1,'{\"role\":\"visitor\"}','update')",
      [bob],
    );
  });
  await asUser(bob, () =>
    assert.rejects(
      db.query("select public.write_record('incidents','b','{}','update')"),
    ),
  );
  await asUser(alice, () =>
    db.query("select public.delete_record('userProfiles',$1)", [bob]),
  );
  await asUser(bob, async () => {
    assert.equal(
      await scalar("select public.read_record('incidents','b') as value"),
      null,
    );
    await assert.rejects(
      db.query("select public.write_record('incidents','c','{}','create')"),
    );
  });
});
test("storage access is restricted to the owner and approved upload path", async () => {
  await asUser(alice, async () => {
    await db.query(
      "insert into storage.objects(bucket_id,name) values ($1,$2)",
      ["contractor-documents", `contractor_documents/${alice}/c/d/file.pdf`],
    );
    await assert.rejects(
      db.query("insert into storage.objects(bucket_id,name) values ($1,$2)", [
        "contractor-documents",
        `contractor_documents/${charlie}/c/d/file.pdf`,
      ]),
    );
  });
  await asUser(charlie, async () => {
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      0,
    );
  });
});
