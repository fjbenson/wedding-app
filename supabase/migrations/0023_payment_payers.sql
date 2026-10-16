-- Who's paying a bill (17 Oct 2026, owner's OK): tag guests on a payment
-- when they pay it themselves — "Mum and Dad are paying the florist". No
-- tag means the couple pay it. Like 0021's tags on to-dos: only a link.
-- (Money given to the couple is 0022's contributions.)
--
-- Additive: one link table, nothing existing changes. Removing a guest or a
-- payment removes its tags with it.

alter table payments add constraint payments_id_wedding unique (id, wedding_id);

create table payment_payers (
  payment_id uuid not null,
  contact_id uuid not null,
  wedding_id uuid not null references weddings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (payment_id, contact_id),
  foreign key (payment_id, wedding_id) references payments (id, wedding_id) on delete cascade,
  foreign key (contact_id, wedding_id) references contacts (id, wedding_id) on delete cascade
);

create index on payment_payers (wedding_id);
create index on payment_payers (contact_id);

alter table payment_payers enable row level security;

create policy "members read payment payers" on payment_payers for select using (is_wedding_member(wedding_id));
create policy "hosts write payment payers"  on payment_payers for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on payment_payers to authenticated;
