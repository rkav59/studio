-- Apply in Supabase before enabling the billing gate.
create table if not exists public.organization_subscriptions (
  organization_id text primary key,
  dodo_subscription_id text unique,
  dodo_customer_id text,
  plan_id text not null default 'pro',
  status text not null default 'pending',
  current_period_end timestamptz,
  updated_at timestamptz not null default now(),
  constraint valid_billing_status check (status in ('active','on_hold','pending','failed','cancelled','expired'))
);
alter table public.organization_subscriptions enable row level security;
-- No client-facing policies: only server-side service-role access is allowed.
revoke all on public.organization_subscriptions from anon, authenticated;
