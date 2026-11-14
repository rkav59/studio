# Gemini Flash-Lite rollout

The app uses `googleai/gemini-2.5-flash-lite` for all ten generation workflows. The model is fixed in `src/ai/model-config.ts`; a model change requires reassessing cost reservations and output quality.

## Defaults and controls

- Verified, active Supabase organisation members only; visitors and anonymous users cannot generate.
- 20 attempts per user per UTC day, shared across all workflows and tenants. Moving organisations does not reset a user's allowance.
- $10 app-wide allowance per UTC calendar month. Reserve $0.01 per attempt, including failed calls, using atomic persistent counters. This is a conservative request allowance, not an invoice reconciliation. No in-memory/server-instance counters or refunds.
- Maximum 12 KB input JSON and 2,048 output tokens; summaries only. No automatic retry, search tool or model fallback in these workflows.
- Qualified human review before applying generated output. Discarding a draft does not refund usage. Contractor status is set to Requires Review, never AI-approved.
- Counters store only user UUID, UTC dates and counts; no prompts or model responses. Private tables have RLS and no client grants; reservation RPC is callable only by the trusted server role. Existing business RLS and ownership mappings are unchanged.

Current Google standard pricing is $0.10 per million input tokens and $0.40 per million output tokens. The allowance deliberately over-reserves typical calls. It excludes hosting, taxes and use of the same API key outside this app. Set an independent provider quota; provider budget alerts alone may not stop spend. Re-evaluate limits when pricing, prompts, tools or model change.

## Staging first

1. Back up the destination and validate restore access. Use an isolated Supabase staging project; per-PR Supabase branches are currently disabled. Do not point a preview at production credentials.
2. Review and run `docs/ai-usage-controls.sql` once in staging. It only adds new objects, starts disabled, and does not migrate Firebase data. It is staged rollout SQL rather than an applied production migration. Supabase CLI was unavailable locally, so no migration history entry has been invented. Generate the deployment migration with the installed CLI during rollout.
3. In Google AI Studio, use a billing-enabled project and review the paid-service data terms. Check that this exact model is available for the intended project/key. Use synthetic data for testing. The free API tier may use submitted content for product improvement; do not use it for company or medical records.
4. Store `GOOGLE_GENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` as server-only Preview secrets. Set the public Supabase URL/publishable key for the same staging project. Never use NEXT_PUBLIC_ for private keys. Set `AI_PAID_TIER_CONFIRMED=true` only after checking billing/data terms; this flag is an administrator attestation, not an automatic Google billing check.
5. Enable the staging allowance using `update ai_private.limits set enabled=true where singleton;`. Adjust `daily_requests` and `monthly_budget_cents` through the database administrator, not an end-user API. Zero budget or enabled=false disables generation. Never reset counters mid-period to work around a cap.
6. Build the preview with those settings. Exercise all ten workflows with sample summaries, missing/expired sign-in, inactive/visitor members, revoked membership, quota exhaustion and provider errors. Confirm no generation on a failed reservation. Check review/discard using keyboard and on mobile; ensure discard never applies output. Inspect actual Google usage and output quality before release.
7. Production key configuration, quota enablement, migration application, merge and deployment remain separate release steps after validation. No production schema or secrets were changed by this implementation.

`GET /api/ai/status` reports configuration presence without secrets. It does not validate the API key, Google billing status, quota enablement or model access. Calls fail closed if the usage RPC is unavailable or disabled.

## Disable / rollback

Set `ai_private.limits.enabled=false` to stop new reservations. Already-reserved calls may finish. Keep counters for audit; do not delete or reset them. Revert the application commit if needed without dropping private tables or touching business records. Remove/revoke the provider key separately if it must be disabled immediately.

References: https://aistudio.google.com/docs/pricing#gemini-2.5-flash-lite and https://supabase.com/docs/guides/database/functions
