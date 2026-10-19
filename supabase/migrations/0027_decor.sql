-- Decor (19 Oct 2026, canvas 3 "Decor · Round 2 · Its own area", owner's
-- pick): the little bits and bobs for the day — jam jars, candles, the easel
-- for the table plan, the guest book pen. Decor is its own special area: its
-- page lists these things grouped by where they go (Ceremony, Entrance, the
-- tables…), and The Day shows them again as one pack list.
--
-- Owner's calls, 19 Oct 2026: who lends it and who sets it up are picked from
-- the wedding's own guests and suppliers (a typed name works too, for someone
-- not on the list); no price on an item (money stays in Money); no photos yet.
--
-- Additive: two new tables, nothing existing changes. A link is only a link:
-- nobody is told, nothing is sent, and the assistant isn't given them.

create table decor_items (
  id              uuid primary key default gen_random_uuid(),
  wedding_id      uuid not null references weddings (id) on delete cascade,
  place           text,                                           -- where it goes: "Ceremony", "The tables"…
  name            text not null check (length(trim(name)) > 0),  -- "Jam jars"
  quantity        integer check (quantity is null or quantity > 0),
  status          text not null default 'to_get'
                  check (status in ('to_get', 'got', 'packed', 'returned')),
  source          text check (source in ('own', 'borrowed', 'hired', 'bought', 'made')),
  -- Who it comes from: a guest or supplier on the list, or just a name.
  from_contact_id uuid,
  from_name       text,
  collect_on      date,                                           -- pick it up
  return_on       date,                                           -- give it back
  setup_names     text,                                           -- helpers not on the list
  notes           text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  unique (id, wedding_id),
  -- Only someone from this same wedding; removing them leaves the item.
  foreign key (from_contact_id, wedding_id) references contacts (id, wedding_id)
    on delete set null (from_contact_id)
);

-- Who sets it up: guests or suppliers from the same wedding.
create table decor_helpers (
  decor_id    uuid not null,
  contact_id  uuid not null,
  wedding_id  uuid not null references weddings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (decor_id, contact_id),
  foreign key (decor_id, wedding_id)   references decor_items (id, wedding_id) on delete cascade,
  foreign key (contact_id, wedding_id) references contacts (id, wedding_id)    on delete cascade
);

create index on decor_items (wedding_id);
create index on decor_items (from_contact_id);
create index on decor_helpers (wedding_id);
create index on decor_helpers (contact_id);

alter table decor_items   enable row level security;
alter table decor_helpers enable row level security;

create policy "members read decor" on decor_items for select using (is_wedding_member(wedding_id));
create policy "hosts write decor"  on decor_items for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read decor helpers" on decor_helpers for select using (is_wedding_member(wedding_id));
create policy "hosts write decor helpers"  on decor_helpers for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on decor_items, decor_helpers to authenticated;
