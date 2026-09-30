-- The Money tab (docs/information-architecture.md, screens 22–24).
--
-- Budget: one figure for the whole wedding, and optionally one per area.
-- "Committed" and "paid" aren't stored — they're worked out from booked
-- suppliers' quotes, their deposits, and the payments below.
--
-- Payments: money owed or paid — a supplier's balance, the rings, the
-- licence. Each may belong to a supplier (contact_id) and an area (area_key,
-- the same key to-dos and suppliers use). Unpaid ones with a due date are
-- "payments due"; paid_on set means it's been paid.

alter table weddings add column if not exists budget numeric(12, 2);
alter table areas    add column if not exists budget numeric(12, 2);

create table payments (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  contact_id  uuid references contacts (id) on delete set null,
  area_key    text,
  description text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  due_date    date,
  paid_on     date,
  notes       text,
  created_at  timestamptz not null default now()
);

create index on payments (wedding_id);

alter table payments enable row level security;

create policy "members read payments" on payments for select using (is_wedding_member(wedding_id));
create policy "hosts write payments"  on payments for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on payments to authenticated;
