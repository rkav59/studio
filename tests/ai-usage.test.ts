import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db = new PGlite();
const alice='11111111-1111-4111-8111-111111111111', bob='22222222-2222-4222-8222-222222222222';
const tenant='33333333-3333-4333-8333-333333333333';
before(async()=> {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
    create table public.profiles(id uuid primary key, organization_id uuid,active boolean,role text);
    insert into auth.users values('${alice}',now()),('${bob}',now());
    insert into public.profiles values('${alice}','${tenant}',true,'admin'),('${bob}','${tenant}',true,'she_rep');`);
  await db.exec(readFileSync('docs/ai-usage-controls.sql','utf8'));
});
after(()=>db.close());
async function reserve(id=alice, org=tenant) {
  await db.exec('set role service_role');
  try { return (await db.query<{result:string}>('select public.reserve_ai_request($1,$2) as result',[id,org])).rows[0].result; }
  finally { await db.exec('reset role'); }
}
test('AI accounting is inaccessible to anonymous and normal signed-in clients', async()=> {
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}`);
    try {
      await assert.rejects(db.query('select public.reserve_ai_request($1,$2)',[alice,tenant]));
      await assert.rejects(db.query('select * from ai_private.monthly_usage'));
    } finally {await db.exec('reset role');}
  }
});
test('AI is disabled until explicitly enabled, and fails closed on invalid tenant or inactive member',async()=> {
  assert.equal(await reserve(),'disabled');
  await db.exec('update ai_private.limits set enabled=true');
  await assert.rejects(reserve(alice,bob));
  await db.exec(`update public.profiles set active=false where id='${alice}'`);
  await assert.rejects(reserve());
  await db.exec(`update public.profiles set active=true where id='${alice}'; update auth.users set email_confirmed_at=null where id='${alice}'`);
  await assert.rejects(reserve());
  await db.exec(`update auth.users set email_confirmed_at=now() where id='${alice}'; update public.profiles set role='visitor' where id='${alice}'`);
  await assert.rejects(reserve());
  await db.exec(`update public.profiles set role='admin' where id='${alice}'`);
});
test('daily quota is per user, monthly budget is global and rejected calls never consume allowance',async()=> {
  await db.exec('update ai_private.limits set daily_requests=2,monthly_budget_cents=3');
  assert.equal(await reserve(),'allowed');
  assert.equal(await reserve(),'allowed');
  assert.equal(await reserve(),'daily_limit');
  assert.equal(await reserve(bob),'allowed');
  assert.equal(await reserve(bob),'monthly_limit');
  assert.equal((await db.query<{reserved_cents:number}>('select reserved_cents from ai_private.monthly_usage')).rows[0].reserved_cents,3);
  assert.equal((await db.query<{requests:number}>('select requests from ai_private.daily_usage where member_id=$1',[bob])).rows[0].requests,1);
});
test('exhausted past periods do not consume a new UTC day or month',async()=> {
  await db.exec(`update ai_private.monthly_usage set month='2000-01-01'; update ai_private.daily_usage set day='2000-01-01'`);
  assert.equal(await reserve(),'allowed');
});
