-- Proves that one couple cannot see or touch another couple's data.
--
-- Run against a scratch database that already has 0001_init.sql applied.
-- Supabase provides auth.users and auth.uid(); locally, stub them first
-- (see docs/ERD.md — "How security works").
--
--   psql -f supabase/migrations/0001_init.sql
--   psql -f supabase/tests/rls_isolation.sql
--
-- Expected: every assertion below passes silently. Any raised exception is a
-- real tenant-isolation bug.

begin;

-- Roles are cluster-wide, so this may already exist from a previous run.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end;
$$;

grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'couple-a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'couple-b@example.com');

insert into weddings (id, name, created_by) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Wedding A', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Wedding B', '22222222-2222-2222-2222-222222222222');

insert into wedding_members (wedding_id, user_id, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'owner');

insert into contacts (wedding_id, first_name, last_name) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Alice', 'GuestOfA'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Bob',   'GuestOfB');

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

do $$
declare
  visible_contacts int;
  visible_weddings int;
begin
  select count(*) into visible_contacts from contacts;
  if visible_contacts <> 1 then
    raise exception 'LEAK: couple A sees % contacts, expected 1', visible_contacts;
  end if;

  select count(*) into visible_weddings from weddings;
  if visible_weddings <> 1 then
    raise exception 'LEAK: couple A sees % weddings, expected 1', visible_weddings;
  end if;

  -- Writing into another wedding must be rejected outright.
  begin
    insert into contacts (wedding_id, first_name)
    values ('bbbbbbbb-0000-0000-0000-000000000002', 'Gatecrasher');
    raise exception 'LEAK: couple A inserted a contact into wedding B';
  exception
    when insufficient_privilege then null;  -- expected
  end;

  update contacts set first_name = 'Hacked'
  where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002';
  if found then
    raise exception 'LEAK: couple A updated wedding B''s contacts';
  end if;

  delete from contacts where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002';
  if found then
    raise exception 'LEAK: couple A deleted wedding B''s contacts';
  end if;

  raise notice 'RLS isolation: all checks passed';
end;
$$;

rollback;
