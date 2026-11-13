# Google sign-in activation for SHEiQpro

The web application already has a Google OAuth button and a client-side Supabase PKCE callback. This PR improves the entry point, callback error handling, and invitation continuation. **OAuth is not live until the Google provider is enabled in the hosted Supabase project with a valid Google OAuth client.** Never commit the Google client secret to GitHub or Vercel.

## Production configuration

1. Open **Google Auth Platform** in Google Cloud Console. Create/configure an OAuth consent screen and a **Web application** OAuth 2.0 client.
2. Add the authorized JavaScript origin:
   - `https://sheiqpro.com`
3. Add the **Authorized redirect URI** (Google redirects to Supabase, not directly to the Next.js app):
   - `https://bvzuqwgvzniedyfgrzyx.supabase.co/auth/v1/callback`
4. On the Supabase project **SHEiQpro** (`bvzuqwgvzniedyfgrzyx`), go to **Authentication → Providers → Google**. Enable Google and securely enter the Google OAuth Client ID and Client Secret. Save. The credentials are held by Supabase Auth, **not** in frontend environment variables.
5. Under **Authentication → URL Configuration**, configure:
   - **Site URL:** `https://sheiqpro.com`
   - **Allowed redirect URL:** `https://sheiqpro.com/auth/callback`
   - Keep `https://sheiqpro.com/reset-password` for recovery links.
6. If Google's OAuth application remains in *Testing* status, add the Google accounts that will test sign-in to its test user allowlist. Publish/verify the OAuth app as required before enabling it for other users.
7. Ensure the existing Vercel production environment includes the public Supabase URL and publishable key (the application's email/password sign-in already uses these). Do not add the Google secret to a `NEXT_PUBLIC_` value.

## Acceptance checks

- From a fresh browser tab open `https://sheiqpro.com/sign-in`; click **Continue with Google**, select a test account, and verify you return to `/dashboard` using an authenticated Supabase session.
- Verify the same account sees its previous profile and role (particularly `rapportsango@gmail.com`) rather than a duplicate, and that admin authorization remains enforced by Supabase profiles/RLS.
- Verify Google sign-up works from `/sign-up` and a new user has an organisation profile created by the existing trusted Supabase trigger.
- Verify that a pending `/join?token=...` invitation survives Google sign-in; acceptance still checks the invited, verified email and role.
- Deny Google consent and verify the callback shows a recoverable error with a link to sign in.
- Test password sign-in/reset and sign-out for regressions.
- For Vercel preview tests, explicitly allow the intended preview `/auth/callback` URL in Supabase. Keep production redirects specific, rather than broad wildcards.

## Troubleshooting

- `Unsupported provider: provider is not enabled`: Google is not enabled in Supabase Auth.
- `redirect_uri_mismatch`: the Google OAuth client is missing the **Supabase** `/auth/v1/callback` URL above.
- `URL not allowed`: add `https://sheiqpro.com/auth/callback` in Supabase Auth allowed redirect URLs.
- `Access blocked: app has not completed the Google verification process`: configure OAuth consent screen/test users or complete Google's publication requirements.
- `Sign-in could not be verified`: check browser storage/PKCE flow and avoid starting sign-in in one browser/device and completing it in another.

References:
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/sessions/pkce-flow
