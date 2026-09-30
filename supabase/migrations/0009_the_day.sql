-- The Day tab (docs/information-architecture.md, screens 25–28): the
-- choreography of the day itself, as opposed to the planning of the run-up.
--
-- Run sheet: the hour-by-hour order of the day. Times are local wall-clock
-- times on the wedding day, so no date or time zone.
--
-- Seating: tables, and which guest sits at which. A guest sits at one table
-- at most (contact_id is the key of seats).
--
-- Transport: each run of a car or coach, and who travels in it.
--
-- Every table carries wedding_id so the usual policies apply directly, and
-- the links (seat → guest and table, passenger → guest and run) must stay
-- inside one wedding: they point at (id, wedding_id) pairs, so a seat can't
-- reference another wedding's guest even by a guessed id.

alter table contacts add constraint contacts_id_wedding unique (id, wedding_id);

create table run_sheet_items (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  at_time     time not null,
  title       text not null,
  location    text,
  who         text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index on run_sheet_items (wedding_id, at_time);

create table seating_tables (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null,
  capacity    int not null default 8 check (capacity > 0),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index on seating_tables (wedding_id);
alter table seating_tables add constraint seating_tables_id_wedding unique (id, wedding_id);

create table seats (
  contact_id  uuid primary key,
  wedding_id  uuid not null references weddings (id) on delete cascade,
  table_id    uuid not null,
  foreign key (contact_id, wedding_id) references contacts (id, wedding_id) on delete cascade,
  foreign key (table_id, wedding_id) references seating_tables (id, wedding_id) on delete cascade
);
create index on seats (wedding_id);

create table transport_runs (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  at_time     time not null,
  vehicle     text not null,
  from_place  text,
  to_place    text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index on transport_runs (wedding_id, at_time);
alter table transport_runs add constraint transport_runs_id_wedding unique (id, wedding_id);

create table transport_passengers (
  run_id      uuid not null,
  contact_id  uuid not null,
  wedding_id  uuid not null references weddings (id) on delete cascade,
  primary key (run_id, contact_id),
  foreign key (run_id, wedding_id) references transport_runs (id, wedding_id) on delete cascade,
  foreign key (contact_id, wedding_id) references contacts (id, wedding_id) on delete cascade
);
create index on transport_passengers (wedding_id);

alter table run_sheet_items      enable row level security;
alter table seating_tables       enable row level security;
alter table seats                enable row level security;
alter table transport_runs       enable row level security;
alter table transport_passengers enable row level security;

create policy "members read run sheet"   on run_sheet_items for select using (is_wedding_member(wedding_id));
create policy "hosts write run sheet"    on run_sheet_items for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
create policy "members read tables"      on seating_tables for select using (is_wedding_member(wedding_id));
create policy "hosts write tables"       on seating_tables for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
create policy "members read seats"       on seats for select using (is_wedding_member(wedding_id));
create policy "hosts write seats"        on seats for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
create policy "members read transport"   on transport_runs for select using (is_wedding_member(wedding_id));
create policy "hosts write transport"    on transport_runs for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
create policy "members read passengers"  on transport_passengers for select using (is_wedding_member(wedding_id));
create policy "hosts write passengers"   on transport_passengers for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on run_sheet_items, seating_tables, seats, transport_runs, transport_passengers to authenticated;
