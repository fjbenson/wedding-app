-- Proves that one couple cannot see or touch another couple's data.
--
-- Run against a scratch database that already has 0001_init.sql applied.
-- Supabase provides auth.users and auth.uid(); locally, stub them first
-- (see docs/ERD.md — "How security works").
--
--   psql -f supabase/migrations/0001_init.sql
--   psql -f supabase/migrations/0003_areas.sql   (and later ones; each table is
--                                                  tested if present)
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

-- Areas (0003_areas.sql), if that migration has been applied.
do $$
begin
  if to_regclass('public.notes') is not null then
    insert into notes (wedding_id, body) values
      ('aaaaaaaa-0000-0000-0000-000000000001', 'Peonies?'),
      ('bbbbbbbb-0000-0000-0000-000000000002', 'Secret plan');
  end if;
  if to_regclass('public.appointments') is not null then
    insert into appointments (wedding_id, title, on_date) values
      ('aaaaaaaa-0000-0000-0000-000000000001', 'Dress fitting', '2027-01-10'),
      ('bbbbbbbb-0000-0000-0000-000000000002', 'Cake tasting', '2027-01-11');
  end if;
  if to_regclass('public.payments') is not null then
    insert into payments (wedding_id, description, amount) values
      ('aaaaaaaa-0000-0000-0000-000000000001', 'Rings', 900),
      ('bbbbbbbb-0000-0000-0000-000000000002', 'Rings', 1200);
  end if;
  if to_regclass('public.areas') is not null then
    insert into areas (wedding_id, key, label) values
      ('aaaaaaaa-0000-0000-0000-000000000001', 'venue', 'Venue'),
      ('bbbbbbbb-0000-0000-0000-000000000002', 'venue', 'Venue');
  end if;
end;
$$;

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

  if to_regclass('public.areas') is not null then
    execute 'select count(*) from areas' into visible_contacts;
    if visible_contacts <> 1 then
      raise exception 'LEAK: couple A sees % areas, expected 1', visible_contacts;
    end if;

    begin
      execute $q$insert into areas (wedding_id, key, label)
               values ('bbbbbbbb-0000-0000-0000-000000000002', 'fireworks', 'Fireworks')$q$;
      raise exception 'LEAK: couple A added an area to wedding B';
    exception
      when insufficient_privilege then null;  -- expected
    end;

    execute $q$update areas set label = 'Hacked'
             where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$;
    get diagnostics visible_contacts = row_count;
    if visible_contacts <> 0 then
      raise exception 'LEAK: couple A updated wedding B''s areas';
    end if;

    execute $q$delete from areas where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$;
    get diagnostics visible_contacts = row_count;
    if visible_contacts <> 0 then
      raise exception 'LEAK: couple A deleted wedding B''s areas';
    end if;
  end if;

  if to_regclass('public.payments') is not null then
    execute 'select count(*) from payments' into visible_contacts;
    if visible_contacts <> 1 then
      raise exception 'LEAK: couple A sees % payments, expected 1', visible_contacts;
    end if;

    begin
      execute $q$insert into payments (wedding_id, description, amount)
               values ('bbbbbbbb-0000-0000-0000-000000000002', 'Sneaky', 1)$q$;
      raise exception 'LEAK: couple A added a payment to wedding B';
    exception
      when insufficient_privilege then null;  -- expected
    end;

    execute $q$update payments set amount = 0
             where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$;
    get diagnostics visible_contacts = row_count;
    if visible_contacts <> 0 then
      raise exception 'LEAK: couple A updated wedding B''s payments';
    end if;

    execute $q$delete from payments where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$;
    get diagnostics visible_contacts = row_count;
    if visible_contacts <> 0 then
      raise exception 'LEAK: couple A deleted wedding B''s payments';
    end if;
  end if;

  if to_regclass('public.appointments') is not null then
    execute 'select count(*) from appointments' into visible_contacts;
    if visible_contacts <> 1 then
      raise exception 'LEAK: couple A sees % appointments, expected 1', visible_contacts;
    end if;

    begin
      execute $q$insert into appointments (wedding_id, title, on_date)
               values ('bbbbbbbb-0000-0000-0000-000000000002', 'Sneaky', '2027-01-01')$q$;
      raise exception 'LEAK: couple A added an appointment to wedding B';
    exception
      when insufficient_privilege then null;  -- expected
    end;

    execute $q$update appointments set title = 'Hacked'
             where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$;
    get diagnostics visible_contacts = row_count;
    if visible_contacts <> 0 then
      raise exception 'LEAK: couple A updated wedding B''s appointments';
    end if;

    execute $q$delete from appointments where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$;
    get diagnostics visible_contacts = row_count;
    if visible_contacts <> 0 then
      raise exception 'LEAK: couple A deleted wedding B''s appointments';
    end if;
  end if;

  if to_regclass('public.notes') is not null then
    execute 'select count(*) from notes' into visible_contacts;
    if visible_contacts <> 1 then
      raise exception 'LEAK: couple A sees % notes, expected 1', visible_contacts;
    end if;

    begin
      execute $q$insert into notes (wedding_id, body)
               values ('bbbbbbbb-0000-0000-0000-000000000002', 'Sneaky')$q$;
      raise exception 'LEAK: couple A added a note to wedding B';
    exception
      when insufficient_privilege then null;  -- expected
    end;

    execute $q$update notes set body = 'Hacked'
             where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$;
    get diagnostics visible_contacts = row_count;
    if visible_contacts <> 0 then
      raise exception 'LEAK: couple A updated wedding B''s notes';
    end if;

    execute $q$delete from notes where wedding_id = 'bbbbbbbb-0000-0000-0000-000000000002'$q$;
    get diagnostics visible_contacts = row_count;
    if visible_contacts <> 0 then
      raise exception 'LEAK: couple A deleted wedding B''s notes';
    end if;
  end if;

  raise notice 'RLS isolation: all checks passed';
end;
$$;

rollback;
