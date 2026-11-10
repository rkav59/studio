# SHEiQpro

Safety, Health and Environmental management application built with Next.js and Supabase.

See [Supabase migration and setup](docs/supabase-migration.md) for project configuration, authentication, private uploads, invitations, deployment and validation.

```sh
npm ci
cp .env.example .env.local
# Fill in the public Supabase configuration and apply the SQL migration.
npm run dev
```

Development runs at http://localhost:9002. Run `npm run typecheck`, `npm run lint`, `npm test` and `npm run build` before deployment. Supabase supplies the backend; the Next.js website requires separate hosting.
