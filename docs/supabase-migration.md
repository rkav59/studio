# Supabase migration

This branch replaces the application's Firebase database, authentication and contractor file uploads with Supabase. It starts with an empty Supabase database. Existing Firebase test accounts and sample data are neither imported nor deleted.

## Architecture

- `src/lib/supabase/client.ts` creates the browser client lazily from public environment variables. There is no service-role key in the application.
- `records.ts` provides the small record API used by the existing forms. Authenticated PostgreSQL functions perform queries and atomic writes.
- `organizations` and `profiles` have typed membership, role and identity columns. An Auth trigger creates each new user's organisation and profile; browser metadata cannot assign roles or memberships.
- `app_records` stores the 31 business collection types in JSONB with typed ownership and organisation foreign keys. This deliberately preserves nested forms, controls, audit checklists and existing record shapes. It is not a fully normalised module-by-module relational redesign. Extract indexed reporting fields or related tables in subsequent migrations as query requirements grow.
- Business records retain the existing **per-user visibility**, including medical records. Being in the same organisation does not automatically expose a colleague's records. Administrators can manage organisation membership; membership alone does not grant access to colleagues' clinical records.
- PostgreSQL enforces record ownership, active membership and write roles. Visitors cannot write business records. SHE representatives can write their own incident, meeting, training-record, audit and induction records; authorizers can write their own permits. Personal KPI settings are writable by active users. Other business writes require admin or SHE officer roles.
- Profile role changes and membership removal are checked in the database. Removing a member deactivates their access, preserving their Auth account and historical records.
- Contractor files live in the private `contractor-documents` bucket with a 10 MB limit. Access rules enforce the owner UUID in the path. Downloads request fresh five-minute signed URLs; permanent public links are not stored. Signed links remain usable until their short expiry.
- Timestamp-based and ISO-string forms are supported. The date codec preserves nested timestamps as tagged JSONB and UI conversions accept both formats. List reads page in groups of 500, avoiding the hosted API row limit silently truncating dashboards.

## Configure a fresh project

The SHEiQpro project has now been created; see [project configuration and rollout status](supabase-project.md). Its migrations are already applied. The steps below also describe provisioning another fresh environment.

1. Create a new Supabase project in the chosen organisation. Do not apply this initial migration over an unrelated existing schema.
2. Apply the SQL files in `supabase/migrations/` in filename order using the Supabase migration tooling or SQL editor. They create the schema, RPCs, Auth trigger, permissions and private bucket, then optimize access policies and invitation indexes. Supabase supplies the `auth` and `storage` schemas.
3. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and the project's enabled **publishable** key in `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A legacy anon key works too, but never use a service-role or secret key in a `NEXT_PUBLIC_` variable.
4. Set `NEXT_PUBLIC_APP_URL` to the canonical app origin. Configure the same origin as Supabase Auth's Site URL. Allow the exact deployed `/auth/callback` and `/reset-password` URLs, plus their localhost equivalents for development. Local development uses port 9002.
5. Enable email/password authentication. Email confirmation is supported; signup shows a confirmation message instead of opening protected pages without a session. Configure production SMTP in Supabase for reliable verification and recovery email delivery.
6. If needed, configure Google/Facebook OAuth providers in Supabase and their provider consoles. Use the Supabase provider callback URL shown in the dashboard. The app callback is `/auth/callback`.
7. Keep the existing server-side Google AI configuration for Genkit. Set `GOOGLE_GENAI_API_KEY` as applicable to the configured provider.
8. Optional transactional email: set `RESEND_API_KEY` and `EMAIL_FROM` to a verified sender on the web application's server. Supabase authentication mail and application invitations/reminders are separate email flows. Without these variables, administrators can still create and copy invitation links; reminders report that email is not configured. A failed provider request is never reported as a successful send.

## Invitations and password recovery

Administrators create a token scoped to an email, organisation and role. The database stores only its hash, limits creation to 30 per admin per hour, and expires it after seven days. The invitee opens `/join?token=...`, signs in with a verified matching email, and explicitly accepts. Tokens are single use. An existing account with organisation records or colleagues must use another account rather than silently switching its organisation. A colleague already in the target organisation is managed through the role editor.

Password recovery emails redirect to `/reset-password`, where the user sets and confirms a new password. Supabase's PKCE session handling processes the recovery link. OAuth and confirmation callbacks redirect to the pending invitation or dashboard. Signing out or changing users clears the query cache.

## Hosting and rollout

Supabase hosts this backend. The Next.js website still needs its own host. Existing Firebase Hosting/App Hosting configuration is retained so changing the backend does not require changing the frontend host at the same time. The same Next.js application can be deployed on a compatible host such as Vercel with the environment variables above. Do not treat a Supabase project URL as a website hosting URL.

Create a preview deployment from this branch, configure its allowed Auth redirects, and complete the hosted acceptance checks before merging or switching the public site. No Firebase resources should be deleted during validation. Rolling back the web deployment restores the previous Firebase application; records created in Supabase are not copied back automatically.

## Verification

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

The tests use real embedded PostgreSQL through PGlite for schema/RPC/RLS checks, with local fixtures for Supabase's auth/storage objects. They cover unauthenticated access, cross-user access, spoofed ownership, nested payloads, filtering, invitations, role changes, removed members and private storage paths. Record API tests cover pagination and propagation of errors. Codec tests cover nested dates and mixed date formats. These do not replace hosted Supabase Auth, Storage and email integration tests.

Hosted acceptance checks after configuration:

- Register a fresh account, confirm email, sign in/out, and reset password.
- Configure and test each enabled OAuth provider.
- Create/edit/delete incidents, risk assessments, audits, training, health and PPE records; verify dates and dashboard counts.
- Upload, replace, download and remove a contractor document; verify that another account cannot access its path.
- Invite a second verified email, accept once, test its role, then deactivate membership.
- Verify that users cannot read another user's records, including within the same organisation.
- Send a reminder only to the signed-in user's verified email and verify delivery through the configured provider.
- Check Supabase security/performance advisories before switching over.

## Existing source issues addressed

The source previously bypassed TypeScript and lint checks during builds. This migration enables them, fixes enum schemas and date payload types, restores missing UI imports/exports, removes the hardcoded developer-email permission override, and fixes several form/record mismatches. The dependency lock file is regenerated so `npm ci` can run reproducibly. These fixes support exercising the migrated workflows rather than suppressing errors.
