# Firebase → Supabase migration reconciliation

**Status: Source access required. No Firestore data has been imported or deleted by this change.**

SHEiQpro uses Supabase Auth and its `public.app_records` PostgreSQL table for live business records. The original Firebase/Firestore source has not been inspected during this audit because the Firebase connection is not yet authorized.

## Verified destination (14 November 2026)

- Supabase project: `bvzuqwgvzniedyfgrzyx` (SHEiQpro)
- Applied migrations: `20261110142500_supabase_backend` and `20261110142746_optimize_access_policies`
- Public tables available: `organizations`, `profiles`, `app_records`, `record_collections`
- Destination counts: **3 profiles and 9 business records**, in 8 collection types:
  - `contractors` 1
  - `kpiThresholds` 2
  - `kpiVisibilitySettings` 1
  - `manualHazards` 1
  - `ppeInspections` 1
  - `ppeItems` 1
  - `sheMeetings` 1
  - `sheqAudits` 1

The source SQL migration explicitly says *Firebase accounts and data were not imported*. These existing Supabase records should be protected from accidental overwrite.

## Source connection (required)

1. Connect the **Firebase** app with read access to the original SHEiQpro Firebase project. Keep Supabase as the live database; Firebase is the **migration source only**, not a new runtime dependency.
2. Verify the source project identity, database ID and relevant storage bucket(s) before any export.
3. Inventory each top-level Firestore collection and document count, including nested subcollections; check Firebase Auth users and files in Storage separately.
4. Confirm whether the source has only disposable sample/test data. If it does, do not import unnecessary records.

## Mapping and safe import controls

- The destination table's key is `(collection, id)`; preserve original record IDs where possible and do not blindly overwrite collisions.
- Destination rows also require `owner_id` (an existing **Supabase Auth UUID**) and `organization_id` (a real destination organization). Do **not** treat legacy Firebase UIDs as Supabase user IDs.
- Map each source owner to a **verified corresponding Supabase Auth account** via an explicit mapping file. Resolve duplicates and unmatched email identities before writes; do not auto-assign unmatched records to the developer.
- Validate each record's collection name against `public.record_collections` (31 supported names).
- Preserve dates, nested objects and timestamp meaning; account for Firestore Timestamp/GeoPoint/reference representations. The live application uses Supabase serialization helpers.
- Do not migrate passwords or token secrets as ordinary Firestore documents. Supabase Auth remains the authentication authority.
- Backup/export destination data and take a source inventory before trial import.
- Trial import to a sandbox/staging destination first. Use *create-if-absent* semantics; produce a collision report and never delete records on the first pass.
- Keep Firebase Storage documents separate from the database migration; the current app stores contractor documents in a **private** Supabase Storage bucket. Migrate only necessary approved files and maintain access policies.

## Acceptance criteria

- Document counts and checksums match by collection, allowing explicitly excluded test records.
- Every imported row has a verified owner and organization; there are no orphan foreign keys.
- Two real sample records per relevant module render correctly in the app; verify dates, owners, nested checklists, uploads and downloads.
- RLS checks deny cross-user and cross-organization access; health/medical records remain private.
- Sign-in, invitation acceptance, audit create/edit, incident reports and dashboard KPIs still work.
- Firebase source remains unchanged and retained until the destination is signed off.

### Read-only destination reconciliation SQL

```sql
select collection, count(*)::integer as records
from public.app_records
group by collection
order by collection;

select count(*)::integer as total_records from public.app_records;
select count(*)::integer as total_profiles from public.profiles;

select r.collection, r.id
from public.app_records r
left join public.profiles p on p.id = r.owner_id
where p.id is null or r.organization_id is distinct from p.organization_id;
```

**Never run a bulk import, overwrite or delete against production solely based on matching collection names.** Require verified source access, an ownership mapping and an approved reconciliation manifest first.
