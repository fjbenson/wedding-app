-- Lists (19 Oct 2026, owner's OK): plain tick-lists with no dates — the
-- toilet baskets, the bridesmaids' room, the emergency kit. A fourth piece of
-- The Day beside Seating, Travel and Decor; a list tagged with an area shows
-- on that area's page too. Not Decor (owner: Decor is detailed per item; a
-- list is just a name and lines to tick).
--
-- Additive: two new tables, nothing existing changes. No people's details.
-- Removing a list removes its lines.

create table lists (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  area_key    text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (id, wedding_id)
);

create table list_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null,
  wedding_id  uuid not null references weddings (id) on delete cascade,
  text        text not null check (length(trim(text)) > 0),
  done        boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  foreign key (list_id, wedding_id) references lists (id, wedding_id) on delete cascade
);

create index on lists (wedding_id);
create index on list_items (wedding_id);
create index on list_items (list_id);

alter table lists enable row level security;
alter table list_items enable row level security;

create policy "members read lists" on lists for select using (is_wedding_member(wedding_id));
create policy "hosts write lists"  on lists for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read list items" on list_items for select using (is_wedding_member(wedding_id));
create policy "hosts write list items"  on list_items for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on lists, list_items to authenticated;
