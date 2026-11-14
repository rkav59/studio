-- Staged rollout SQL. Apply to an isolated database and validate before production.
-- New objects only: existing business records, ownership and RLS are untouched.
create schema if not exists ai_private;
revoke all on schema ai_private from public, anon, authenticated;
create table ai_private.limits (
  singleton boolean primary key default true check (singleton),
  monthly_budget_cents integer not null default 1000 check (monthly_budget_cents >= 0),
  daily_requests integer not null default 20 check (daily_requests >= 0),
  enabled boolean not null default false
);
insert into ai_private.limits(singleton) values(true);
create table ai_private.monthly_usage (
  month date primary key, reserved_cents integer not null check (reserved_cents >= 0)
);
create table ai_private.daily_usage (
  day date not null, member_id uuid not null, requests integer not null check (requests >= 0),
  primary key(day,member_id)
);
alter table ai_private.limits enable row level security;
alter table ai_private.monthly_usage enable row level security;
alter table ai_private.daily_usage enable row level security;
revoke all on all tables in schema ai_private from public,anon,authenticated,service_role;

-- Definer privileges are necessary for private counters; only trusted server credentials may reserve.
create function ai_private.reserve_request(member_id uuid, tenant_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  limits ai_private.limits;
  utc_day date := (now() at time zone 'UTC')::date;
  utc_month date := date_trunc('month', now() at time zone 'UTC')::date;
  used integer;
begin
  -- One locked row serialises both global and per-user limits across server instances.
  select * into limits from ai_private.limits where singleton for update;
  if not found or not limits.enabled then return 'disabled'; end if;
  if not exists(select 1 from public.profiles p join auth.users u on u.id=p.id
    where p.id=member_id and p.organization_id=tenant_id and p.active
    and p.role in ('admin','she_officer','authorizer','she_rep') and u.email_confirmed_at is not null)
  then raise exception 'Active verified membership required'; end if;
  select requests into used from ai_private.daily_usage d where d.day=utc_day and d.member_id=reserve_request.member_id;
  if coalesce(used,0) >= limits.daily_requests then return 'daily_limit'; end if;
  select reserved_cents into used from ai_private.monthly_usage where month=utc_month;
  -- Reserve one USD cent per attempted generation, without refunds, before contacting Google.
  if coalesce(used,0)+1 > limits.monthly_budget_cents then return 'monthly_limit'; end if;
  insert into ai_private.monthly_usage values(utc_month,1)
    on conflict(month) do update set reserved_cents=ai_private.monthly_usage.reserved_cents+1;
  insert into ai_private.daily_usage values(utc_day,member_id,1)
    on conflict on constraint daily_usage_pkey do update set requests=ai_private.daily_usage.requests+1;
  return 'allowed';
end $$;
create function public.reserve_ai_request(member_id uuid,tenant_id uuid) returns text
language sql security invoker set search_path = '' as $$
  select ai_private.reserve_request(member_id,tenant_id)
$$;
revoke all on function ai_private.reserve_request(uuid,uuid) from public,anon,authenticated;
revoke all on function public.reserve_ai_request(uuid,uuid) from public,anon,authenticated;
grant usage on schema ai_private to service_role;
grant execute on function ai_private.reserve_request(uuid,uuid) to service_role;
grant execute on function public.reserve_ai_request(uuid,uuid) to service_role;

-- Enable only after paid key, model access, staging tests and billing terms are validated:
-- update ai_private.limits set enabled=true where singleton;
-- Set an independent provider-side quota as well; this allowance covers this app's calls only.
