-- Fresh development setup. Existing Firebase accounts/data are deliberately not imported.
create table public.organizations (
 id uuid primary key default gen_random_uuid(), name text not null default 'My organization', created_at timestamptz not null default now()
);
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 organization_id uuid not null references public.organizations(id),
 email text not null, display_name text not null default '', country text not null default '',
 role text not null default 'admin' check(role in ('admin','she_officer','authorizer','she_rep','visitor')),
 plan_id text not null default 'premium', active boolean not null default true, created_at timestamptz not null default now()
);
create table public.record_collections (name text primary key);
insert into public.record_collections(name) values
 ('contractors'),('emergencyPlans'),('emergencyResources'),('incidents'),('inductionQuestions'),('inductionRecords'),
 ('industrialHygieneSamples'),('jobCards'),('kpiSuggestions'),('kpiThresholds'),('kpiVisibilitySettings'),('manualHazards'),
 ('manualRiskAssessments'),('medicalTestRecords'),('mockDrills'),('permitsToWork'),('ppeInspections'),('ppeIssuances'),
 ('ppeItems'),('ppeJobRoleMatrix'),('ptwSupervisionRecords'),('riskRegisterEntries'),('sheMeetings'),('shePrograms'),
 ('sheqAudits'),('similarExposureGroups'),('trainingCourses'),('trainingJobRoleMatrix'),('trainingRecords'),
 ('userChecklistTemplates'),('wellnessPrograms');
-- Typed ownership and membership columns; nested form payloads remain JSONB in this migration.
create table public.app_records (
 collection text not null references public.record_collections(name), id text not null,
 owner_id uuid not null references auth.users(id), organization_id uuid not null references public.organizations(id),
 data jsonb not null check(jsonb_typeof(data)='object'), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), primary key(collection,id)
);
create index records_owner_collection on public.app_records(owner_id,collection,id);
create index records_organization on public.app_records(organization_id);
create index profiles_organization on public.profiles(organization_id);
create table public.organization_invitations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 email text not null, role text not null check(role in ('admin','she_officer','authorizer','she_rep','visitor')),
 token_hash text not null unique, invited_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '7 days', accepted_at timestamptz
);

create function public.current_organization() returns uuid language sql stable security definer set search_path = '' as $$
 select organization_id from public.profiles where id=auth.uid() and active
$$;
create function public.can_write_collection(collection_name text) returns boolean language sql stable security definer set search_path = '' as $$
 select coalesce((select active and (role in ('admin','she_officer')
  or collection_name in ('kpiSuggestions','kpiThresholds','kpiVisibilitySettings')
  or (role='she_rep' and collection_name in ('incidents','sheMeetings','trainingRecords','sheqAudits','inductionRecords'))
  or (role='authorizer' and collection_name='permitsToWork')) from public.profiles where id=auth.uid()),false)
$$;
create function public.bootstrap_profile() returns trigger language plpgsql security definer set search_path = '' as $$
 declare org uuid;
 begin
  insert into public.organizations default values returning id into org;
  insert into public.profiles(id,organization_id,email,display_name,country)
   values(new.id,org,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'displayName',new.raw_user_meta_data->>'full_name',''),coalesce(new.raw_user_meta_data->>'country',''));
  return new;
 end
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.bootstrap_profile();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.record_collections enable row level security;
alter table public.app_records enable row level security;
alter table public.organization_invitations enable row level security;
create policy organizations_read on public.organizations for select to authenticated using(id=public.current_organization());
create policy profiles_read on public.profiles for select to authenticated using(organization_id=public.current_organization() and active);
-- Preserve the existing application's per-user business-record visibility. Do not silently widen access to medical records.
create policy records_read on public.app_records for select to authenticated using(owner_id=auth.uid() and organization_id=public.current_organization());
create policy collection_names_read on public.record_collections for select to authenticated using(true);
revoke all on public.organizations,public.profiles,public.record_collections,public.app_records,public.organization_invitations from anon,authenticated;
grant select on public.organizations,public.profiles,public.record_collections,public.app_records to authenticated;

create function public.records_for_collection(collection_name text) returns table(id text,data jsonb)
 language sql stable security invoker set search_path = '' as $$
 select r.id, r.data || jsonb_build_object('userId',r.owner_id,'organizationId',r.organization_id)
 from public.app_records r where r.collection=collection_name
 union all
 select p.id::text,jsonb_build_object('email',p.email,'displayName',p.display_name,'country',p.country,'role',p.role,
  'organizationId',p.organization_id,'planId',p.plan_id,'createdAt',p.created_at)
 from public.profiles p where collection_name='userProfiles'
$$;
create function public.read_record(collection_name text,record_id text) returns jsonb
 language sql stable security invoker set search_path = '' as $$
 select r.data from public.records_for_collection(collection_name) r where r.id=record_id
$$;
create function public.record_value(v jsonb) returns jsonb language sql immutable set search_path = '' as $$
 select case when jsonb_typeof(v)='object' and v ? '__sheiq_timestamp' then v->'__sheiq_timestamp' else v end
$$;
create function public.record_matches(data jsonb,filter jsonb) returns boolean language plpgsql immutable set search_path = '' as $$
 declare a jsonb:=public.record_value(data->(filter->>'field')); b jsonb:=public.record_value(filter->'value');
 begin
  return coalesce(case filter->>'op'
   when '==' then a=b when '!=' then a<>b when '>' then a>b when '>=' then a>=b when '<' then a<b when '<=' then a<=b
   when 'in' then exists(select 1 from jsonb_array_elements(b) x where public.record_value(x)=a)
   else false end,false);
 end
$$;
create function public.list_records(collection_name text,filters jsonb default '[]',ordering jsonb default '[]',page_offset integer default 0,page_size integer default 500)
 returns table(id text,data jsonb) language plpgsql stable security invoker set search_path = '' as $$
 declare sort_sql text:=''; o jsonb;
 begin
  if jsonb_typeof(filters)<>'array' or jsonb_typeof(ordering)<>'array' or jsonb_array_length(filters)>20 or jsonb_array_length(ordering)>10 then raise exception 'Invalid query'; end if;
  for o in select value from jsonb_array_elements(ordering) loop
   sort_sql:=sort_sql||format('public.record_value(r.data->%L) %s nulls last,',o->>'field',case when o->>'direction'='desc' then 'desc' else 'asc' end);
  end loop;
  return query execute 'select r.id,r.data from public.records_for_collection($1) r
   where not exists(select 1 from jsonb_array_elements($2) f where not public.record_matches(r.data,f))
   order by '||sort_sql||'r.id limit $3 offset $4'
   using collection_name,filters,least(greatest(page_size,1),500),greatest(page_offset,0);
 end
$$;

create function public.write_record(collection_name text,record_id text,payload jsonb,write_mode text default 'update') returns void
 language plpgsql security definer set search_path = '' as $$
 declare me public.profiles; target public.profiles; old public.app_records; clean jsonb;
 begin
  select * into me from public.profiles where id=auth.uid() and active;
  if me.id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(payload)<>'object' or length(record_id)>200 or record_id='' or write_mode not in ('create','replace','merge','update') then raise exception 'Invalid write'; end if;
  if collection_name='userProfiles' then
   select * into target from public.profiles where id::text=record_id and active for update;
   if target.id is null or target.organization_id<>me.organization_id then raise exception 'Profile unavailable'; end if;
   if payload ? 'role' then
    if me.role<>'admin' or target.id=me.id or exists(select 1 from jsonb_object_keys(payload) k where k<>'role') then raise exception 'Role change denied'; end if;
    update public.profiles set role=payload->>'role' where id=target.id;
   else
    if target.id<>me.id or exists(select 1 from jsonb_object_keys(payload) k where k not in ('displayName','country')) then raise exception 'Profile change denied'; end if;
    update public.profiles set display_name=coalesce(payload->>'displayName',display_name),country=coalesce(payload->>'country',country) where id=me.id;
   end if;
   return;
  end if;
  if not public.can_write_collection(collection_name) then raise exception 'Permission denied'; end if;
  -- Serialise concurrent creates, merges and updates to one record.
  perform pg_advisory_xact_lock(hashtextextended(collection_name||'/'||record_id,0));
  select * into old from public.app_records where collection=collection_name and id=record_id for update;
  if old.id is not null and (old.owner_id<>me.id or old.organization_id<>me.organization_id) then raise exception 'Record unavailable'; end if;
  if (write_mode='create' and old.id is not null) or (write_mode='update' and old.id is null) then raise exception 'Record state conflict'; end if;
  if payload ? 'userId' and payload->>'userId'<>me.id::text then raise exception 'Invalid owner'; end if;
  if payload ? 'organizationId' and payload->>'organizationId'<>me.organization_id::text then raise exception 'Invalid organization'; end if;
  clean:=payload-'userId'-'organizationId'-'id';
  if old.id is not null and write_mode in ('merge','update') then clean:=old.data||clean; end if;
  insert into public.app_records(collection,id,owner_id,organization_id,data) values(collection_name,record_id,me.id,me.organization_id,clean)
  on conflict(collection,id) do update set data=excluded.data,updated_at=now();
 end
$$;
create function public.delete_record(collection_name text,record_id text) returns void language plpgsql security definer set search_path = '' as $$
 declare me public.profiles;
 begin
  select * into me from public.profiles where id=auth.uid() and active;
  if me.id is null then raise exception 'Authentication required'; end if;
  if collection_name='userProfiles' then
   if me.role<>'admin' or record_id=me.id::text then raise exception 'Removal denied'; end if;
   update public.profiles set active=false where id::text=record_id and organization_id=me.organization_id and role<>'admin';
  else
   if not public.can_write_collection(collection_name) then raise exception 'Permission denied'; end if;
   delete from public.app_records where collection=collection_name and id=record_id and owner_id=me.id and organization_id=me.organization_id;
  end if;
  if not found then raise exception 'Record unavailable'; end if;
 end
$$;

create function public.create_invitation(invitee_email text,invitee_role text) returns text language plpgsql security definer set search_path = '' as $$
 declare me public.profiles; token text:=gen_random_uuid()::text||gen_random_uuid()::text;
 begin
  select * into me from public.profiles where id=auth.uid() and active and role='admin';
  if me.id is null then raise exception 'Administrator access required'; end if;
  if length(invitee_email)>254 or invitee_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  if (select count(*) from public.organization_invitations where invited_by=me.id and created_at>now()-interval '1 hour')>=30 then raise exception 'Invitation limit reached. Try again later.'; end if;
  update public.organization_invitations set expires_at=now() where organization_id=me.organization_id and email=lower(trim(invitee_email)) and accepted_at is null;
  insert into public.organization_invitations(organization_id,email,role,token_hash,invited_by)
   values(me.organization_id,lower(trim(invitee_email)),invitee_role,encode(sha256(convert_to(token,'UTF8')),'hex'),me.id);
  return token;
 end
$$;
create function public.accept_invitation(token text) returns void language plpgsql security definer set search_path = '' as $$
 declare invitation public.organization_invitations; me public.profiles; verified_email text;
 begin
  select * into me from public.profiles where id=auth.uid() and active for update;
  select email into verified_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if me.id is null or verified_email is null then raise exception 'Sign in with a verified email to accept'; end if;
  select * into invitation from public.organization_invitations where token_hash=encode(sha256(convert_to(token,'UTF8')),'hex') for update;
  if invitation.id is null or invitation.expires_at<=now() or invitation.accepted_at is not null or invitation.email<>lower(verified_email) then raise exception 'Invitation is invalid, expired, or belongs to another email'; end if;
  if invitation.organization_id<>me.organization_id then
   if exists(select 1 from public.app_records where organization_id=me.organization_id)
    or (select count(*) from public.profiles where organization_id=me.organization_id and active)>1 then
     raise exception 'This account already belongs to an organization with records or colleagues. Use a new account.';
   end if;
   update public.profiles set organization_id=invitation.organization_id,role=invitation.role where id=me.id;
  else
   raise exception 'You already belong to this organization';
  end if;
  update public.organization_invitations set accepted_at=now() where id=invitation.id;
 end
$$;

-- Private uploads. Paths retain contractor_documents/<user UUID>/... .
insert into storage.buckets(id,name,public,file_size_limit) values('contractor-documents','contractor-documents',false,10485760);
create policy contractor_files_read on storage.objects for select to authenticated using(
 bucket_id='contractor-documents' and (storage.foldername(name))[1]='contractor_documents'
 and (storage.foldername(name))[2]=auth.uid()::text and public.current_organization() is not null);
create policy contractor_files_insert on storage.objects for insert to authenticated with check(
 bucket_id='contractor-documents' and (storage.foldername(name))[1]='contractor_documents'
 and (storage.foldername(name))[2]=auth.uid()::text and public.can_write_collection('contractors'));
create policy contractor_files_delete on storage.objects for delete to authenticated using(
 bucket_id='contractor-documents' and (storage.foldername(name))[1]='contractor_documents'
 and (storage.foldername(name))[2]=auth.uid()::text and public.can_write_collection('contractors'));

-- Supabase grants function execution to PUBLIC by default; restrict every new RPC.
revoke all on function public.bootstrap_profile() from public,anon,authenticated;
revoke all on function public.current_organization(),public.can_write_collection(text),public.records_for_collection(text),
 public.read_record(text,text),public.record_value(jsonb),public.record_matches(jsonb,jsonb),public.list_records(text,jsonb,jsonb,integer,integer),
 public.write_record(text,text,jsonb,text),public.delete_record(text,text),public.create_invitation(text,text),public.accept_invitation(text) from public,anon;
grant execute on function public.current_organization(),public.can_write_collection(text),public.records_for_collection(text),
 public.read_record(text,text),public.record_value(jsonb),public.record_matches(jsonb,jsonb),public.list_records(text,jsonb,jsonb,integer,integer),
 public.write_record(text,text,jsonb,text),public.delete_record(text,text),public.create_invitation(text,text),public.accept_invitation(text) to authenticated;
