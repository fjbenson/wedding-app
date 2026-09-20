-- Wedding App — initial schema
-- MVP: contacts, timeline, RSVP, on a multi-tenant foundation.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type member_role     as enum ('owner', 'planner', 'guest');
create type contact_type    as enum ('guest', 'supplier', 'bridal_party', 'venue');
create type supplier_status as enum ('researching', 'enquired', 'booked', 'cancelled');
create type rsvp_status     as enum ('pending', 'attending', 'declined');
create type milestone_status as enum ('todo', 'in_progress', 'done', 'skipped');

-- ---------------------------------------------------------------------------
-- Foundation
-- ---------------------------------------------------------------------------

create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table weddings (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  wedding_date     date,
  venue_contact_id uuid,  -- FK added after contacts exists
  created_by       uuid not null references profiles (id),
  created_at       timestamptz not null default now()
);

create table wedding_members (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings (id) on delete cascade,
  user_id    uuid not null references profiles (id) on delete cascade,
  role       member_role not null default 'planner',
  contact_id uuid,  -- FK added after contacts exists; links a guest login to their contact record
  created_at timestamptz not null default now(),
  unique (wedding_id, user_id)
);

create index on wedding_members (user_id);
create index on wedding_members (wedding_id);

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------

create table households (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references weddings (id) on delete cascade,
  name          text not null,
  address_line1 text,
  address_line2 text,
  city          text,
  postcode      text,
  country       text,
  created_at    timestamptz not null default now()
);

create index on households (wedding_id);

create table contacts (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references weddings (id) on delete cascade,
  household_id uuid references households (id) on delete set null,
  contact_type contact_type not null default 'guest',
  first_name   text not null,
  last_name    text,
  email        text,
  phone        text,
  notes        text,
  is_child     boolean not null default false,
  created_at   timestamptz not null default now()
);

create index on contacts (wedding_id);
create index on contacts (household_id);
create index on contacts (wedding_id, contact_type);

alter table weddings
  add constraint weddings_venue_contact_id_fkey
  foreign key (venue_contact_id) references contacts (id) on delete set null;

alter table wedding_members
  add constraint wedding_members_contact_id_fkey
  foreign key (contact_id) references contacts (id) on delete set null;

create table supplier_details (
  contact_id   uuid primary key references contacts (id) on delete cascade,
  company_name text,
  category     text,
  status       supplier_status not null default 'researching',
  quoted_cost  numeric(12, 2),
  deposit_paid numeric(12, 2),
  contract_url text,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Events & RSVP
-- ---------------------------------------------------------------------------

create table events (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references weddings (id) on delete cascade,
  name       text not null,
  starts_at  timestamptz,
  ends_at    timestamptz,
  location   text,
  created_at timestamptz not null default now()
);

create index on events (wedding_id);

create table invitations (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references weddings (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  token        text not null unique default encode(gen_random_bytes(16), 'hex'),
  sent_at      timestamptz,
  created_at   timestamptz not null default now(),
  unique (wedding_id, household_id)
);

create index on invitations (wedding_id);

create table rsvps (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references weddings (id) on delete cascade,
  invitation_id uuid references invitations (id) on delete set null,
  contact_id    uuid not null references contacts (id) on delete cascade,
  event_id      uuid not null references events (id) on delete cascade,
  status        rsvp_status not null default 'pending',
  meal_choice   text,
  dietary_notes text,
  responded_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (contact_id, event_id)
);

create index on rsvps (wedding_id);
create index on rsvps (event_id);

-- ---------------------------------------------------------------------------
-- Timeline
-- ---------------------------------------------------------------------------

create table milestones (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references weddings (id) on delete cascade,
  title        text not null,
  description  text,
  category     text,
  due_date     date,
  remind_at    timestamptz,
  status       milestone_status not null default 'todo',
  assigned_to  uuid references profiles (id) on delete set null,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);

create index on milestones (wedding_id);
create index on milestones (wedding_id, due_date);

-- ---------------------------------------------------------------------------
-- Access control
--
-- Every table is scoped to a wedding. The helper below answers "is the current
-- user a member of this wedding?" and every policy is built on it.
--
-- SECURITY DEFINER matters: it lets the function read wedding_members without
-- triggering that table's own policy, which would recurse forever.
-- ---------------------------------------------------------------------------

create or replace function is_wedding_member(target_wedding_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from wedding_members
    where wedding_members.wedding_id = target_wedding_id
      and wedding_members.user_id = auth.uid()
  );
$$;

create or replace function is_wedding_host(target_wedding_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from wedding_members
    where wedding_members.wedding_id = target_wedding_id
      and wedding_members.user_id = auth.uid()
      and wedding_members.role in ('owner', 'planner')
  );
$$;

alter table profiles         enable row level security;
alter table weddings         enable row level security;
alter table wedding_members  enable row level security;
alter table households       enable row level security;
alter table contacts         enable row level security;
alter table supplier_details enable row level security;
alter table events           enable row level security;
alter table invitations      enable row level security;
alter table rsvps            enable row level security;
alter table milestones       enable row level security;

-- Profiles: you can read and edit your own.
create policy "read own profile"   on profiles for select using (id = auth.uid());
create policy "update own profile" on profiles for update using (id = auth.uid());
create policy "insert own profile" on profiles for insert with check (id = auth.uid());

-- Weddings: visible to members; only hosts can change them.
create policy "members read wedding"  on weddings for select using (is_wedding_member(id));
create policy "hosts update wedding"  on weddings for update using (is_wedding_host(id));
create policy "anyone creates wedding" on weddings for insert with check (created_by = auth.uid());

-- Memberships: visible to fellow members; only hosts can hand out access.
create policy "members read memberships" on wedding_members for select using (is_wedding_member(wedding_id));
create policy "hosts manage memberships" on wedding_members for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

-- Wedding data. MVP is host-only, so writes are restricted to hosts while
-- reads are open to any member — the seam guest access will slot into.
create policy "members read households"   on households for select using (is_wedding_member(wedding_id));
create policy "hosts write households"    on households for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read contacts"     on contacts for select using (is_wedding_member(wedding_id));
create policy "hosts write contacts"      on contacts for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read events"       on events for select using (is_wedding_member(wedding_id));
create policy "hosts write events"        on events for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read invitations"  on invitations for select using (is_wedding_member(wedding_id));
create policy "hosts write invitations"   on invitations for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read rsvps"        on rsvps for select using (is_wedding_member(wedding_id));
create policy "hosts write rsvps"         on rsvps for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read milestones"   on milestones for select using (is_wedding_member(wedding_id));
create policy "hosts write milestones"    on milestones for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

-- supplier_details has no wedding_id of its own; it inherits via its contact.
create policy "members read supplier details" on supplier_details for select
  using (exists (
    select 1 from contacts c
    where c.id = supplier_details.contact_id and is_wedding_member(c.wedding_id)
  ));

create policy "hosts write supplier details" on supplier_details for all
  using (exists (
    select 1 from contacts c
    where c.id = supplier_details.contact_id and is_wedding_host(c.wedding_id)
  ))
  with check (exists (
    select 1 from contacts c
    where c.id = supplier_details.contact_id and is_wedding_host(c.wedding_id)
  ));

-- ---------------------------------------------------------------------------
-- New signups get a profile row automatically.
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
