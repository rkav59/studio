-- Cover invitation foreign keys and the administrator rate-limit lookup.
create index invitations_inviter_created on public.organization_invitations(invited_by, created_at);
create index invitations_organization_email on public.organization_invitations(organization_id, email);

-- These identity lookups are constant for a statement, not per record.
alter policy organizations_read on public.organizations using(id=(select public.current_organization()));
alter policy profiles_read on public.profiles using(organization_id=(select public.current_organization()) and active);
alter policy records_read on public.app_records using(owner_id=(select auth.uid()) and organization_id=(select public.current_organization()));
alter policy contractor_files_read on storage.objects using(
 bucket_id='contractor-documents' and (storage.foldername(name))[1]='contractor_documents'
 and (storage.foldername(name))[2]=(select auth.uid())::text and (select public.current_organization()) is not null);
alter policy contractor_files_insert on storage.objects with check(
 bucket_id='contractor-documents' and (storage.foldername(name))[1]='contractor_documents'
 and (storage.foldername(name))[2]=(select auth.uid())::text and (select public.can_write_collection('contractors')));
alter policy contractor_files_delete on storage.objects using(
 bucket_id='contractor-documents' and (storage.foldername(name))[1]='contractor_documents'
 and (storage.foldername(name))[2]=(select auth.uid())::text and (select public.can_write_collection('contractors')));
