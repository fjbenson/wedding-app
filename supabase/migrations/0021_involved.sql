-- Who's involved (16 Oct 2026, owner's OK): tag guests on a to-do or an
-- appointment — "Ask Amy about the readings", "Dress fitting with Mum and
-- Sophie". A tag is only a link: nobody is told, nothing is sent.
--
-- Additive: two link tables, nothing existing changes. Removing a guest, a
-- to-do or an appointment removes its tags with it.

-- So the link tables can insist both sides belong to the same wedding (as
-- seats, passengers and groups do).
alter table milestones   add constraint milestones_id_wedding   unique (id, wedding_id);
alter table appointments add constraint appointments_id_wedding unique (id, wedding_id);

create table milestone_guests (
  milestone_id uuid not null,
  contact_id   uuid not null,
  wedding_id   uuid not null references weddings (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (milestone_id, contact_id),
  foreign key (milestone_id, wedding_id) references milestones (id, wedding_id) on delete cascade,
  foreign key (contact_id, wedding_id)   references contacts (id, wedding_id)   on delete cascade
);

create table appointment_guests (
  appointment_id uuid not null,
  contact_id     uuid not null,
  wedding_id     uuid not null references weddings (id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (appointment_id, contact_id),
  foreign key (appointment_id, wedding_id) references appointments (id, wedding_id) on delete cascade,
  foreign key (contact_id, wedding_id)     references contacts (id, wedding_id)     on delete cascade
);

create index on milestone_guests (wedding_id);
create index on milestone_guests (contact_id);
create index on appointment_guests (wedding_id);
create index on appointment_guests (contact_id);

alter table milestone_guests   enable row level security;
alter table appointment_guests enable row level security;

create policy "members read milestone guests" on milestone_guests for select using (is_wedding_member(wedding_id));
create policy "hosts write milestone guests"  on milestone_guests for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read appointment guests" on appointment_guests for select using (is_wedding_member(wedding_id));
create policy "hosts write appointment guests"  on appointment_guests for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on milestone_guests, appointment_guests to authenticated;
