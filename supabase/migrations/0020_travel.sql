-- Travel (15 Oct 2026, canvas 3 "Travel · First version"): The Day's
-- Transport became Travel — where everyone is sleeping, and how everyone is
-- getting there and back. Journeys are the existing transport_runs; this adds
-- the places to stay and, on each guest, whether and where they're staying.
--
-- Additive: one new table and three new columns on contacts, nothing existing
-- changes. Removing a place never removes its guests: they drop back to
-- "staying, not sure where".

create table stays (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  -- Anything the couple want to remember: the address, a booking code.
  note        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  unique (id, wedding_id)
);

create index on stays (wedding_id);

-- On each guest: are they staying over ('yes' / 'no', null = not asked yet),
-- where (only with 'yes'; null = not sure where), and are they making their
-- own way (so they don't count as having no lift).
alter table contacts
  add column staying text check (staying in ('yes', 'no')),
  add column stay_id uuid,
  add column own_way boolean not null default false,
  -- (stay_id, wedding_id) so a guest can only stay at their own wedding's
  -- places; removing a place clears stay_id alone, keeping wedding_id.
  add constraint contacts_stay_fk foreign key (stay_id, wedding_id)
    references stays (id, wedding_id) on delete set null (stay_id),
  add constraint contacts_stay_needs_yes check (stay_id is null or staying = 'yes');

create index on contacts (stay_id);

alter table stays enable row level security;

create policy "members read stays" on stays for select using (is_wedding_member(wedding_id));
create policy "hosts write stays"  on stays for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
