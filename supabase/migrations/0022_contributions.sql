-- Who's paying for what (17 Oct 2026, owner's OK): money coming in towards
-- the wedding — "Mum and Dad, £5,000 for the venue", "Grandma, £500". Money
-- so far only knew what goes out.
--
-- Additive: one new table, nothing existing changes. A gift can name a guest
-- (picked from the guest list) or just a name typed in ("Us", "Grandma").
-- Removing that guest keeps the gift and its typed name; only the link goes.

create table contributions (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null,
  contact_id  uuid,
  amount      numeric(10, 2) not null check (amount >= 0),
  -- An area's key, as payments use; empty = towards the wedding as a whole.
  area_key    text,
  -- Set once the money has arrived; empty = promised.
  received_on date,
  notes       text,
  created_at  timestamptz not null default now(),
  foreign key (contact_id, wedding_id) references contacts (id, wedding_id) on delete set null (contact_id)
);

create index on contributions (wedding_id);
create index on contributions (contact_id);

alter table contributions enable row level security;

create policy "members read contributions" on contributions for select using (is_wedding_member(wedding_id));
create policy "hosts write contributions"  on contributions for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on contributions to authenticated;
