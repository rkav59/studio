# SHEiQpro Supabase project

Created on 10 November 2026 in `rkav59's Org` (Free plan).

- Project reference: `bvzuqwgvzniedyfgrzyx`
- Region: `eu-west-2` (London)
- API URL: `https://bvzuqwgvzniedyfgrzyx.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/bvzuqwgvzniedyfgrzyx

Use these public client settings in the web host's environment:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://bvzuqwgvzniedyfgrzyx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_wnw7kVyVGvhgdzCJY-bRYA_P0wejGie
```

This publishable key is intended for browser use and grants no administrative access. Never substitute a secret or service-role key.

## Applied and verified

The backend and access-policy optimization migrations have been applied. All five application tables have RLS enabled, 31 business collection names are registered, and the contractor documents bucket is private with a 10 MB file limit. A transaction-scoped hosted smoke test exercised Auth profile creation, record creation and cross-user isolation, then rolled back its test data. Anonymous callers cannot execute the write, delete or invitation RPCs.

The security advisor flags the six intentionally authenticated SECURITY DEFINER functions. They enforce active identity, ownership, organisation membership and operation-specific roles in their bodies; anonymous execution is revoked and search paths are fixed. Review these checks when changing these functions: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

The invitation table intentionally has no direct client policy or grants; invitation access is restricted to validated RPCs. Its deny-by-default advisor notice is expected: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

Unused-index notices are expected for this empty database. Retain the ownership and foreign-key indexes for application traffic.

## Still required for launch

The website has not been redeployed or switched from Firebase. Configure the web host with the public settings above, set the canonical `NEXT_PUBLIC_APP_URL`, configure Supabase Auth Site URL and allowed redirects, and complete the hosted acceptance checklist in `supabase-migration.md`. Email delivery, OAuth and browser file uploads have not yet been verified against this project.

The pre-existing Supabase projects `oshem` and `Budgeting` have not been deleted. The connector does not expose project deletion; dashboard access is required.
