-- Areas of the wedding, as rows (docs/information-architecture.md,
-- "Areas are rows, not code").
--
-- Venue, flowers, cake, music… are the dots on the hub's orb. There is no
-- correct list, so each wedding keeps its own: a starter set is offered at
-- first-run setup, and couples switch them off or add their own
-- ("Honeymoon", "Fireworks").
--
-- `key` is the stable name other rows use to say which area they belong to
-- (milestones.category and supplier_details.category hold it today). The plan
-- has those becoming an `area_id` foreign key later; that's a separate step.
--
-- `enabled` is whether the couple is planning that area at all;
-- `show_on_hub` is whether it gets a dot. Kept apart so an area used only for
-- filing doesn't clutter the orb. Starter areas the couple unticks are still
-- stored, switched off, so they can be turned back on in Settings.

create table areas (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  key         text not null,
  label       text not null,
  enabled     boolean not null default true,
  show_on_hub boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (wedding_id, key)
);

create index on areas (wedding_id);

alter table areas enable row level security;

create policy "members read areas" on areas for select using (is_wedding_member(wedding_id));
create policy "hosts write areas"  on areas for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on areas to authenticated;
