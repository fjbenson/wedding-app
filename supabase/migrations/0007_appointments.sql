-- Appointments (docs/information-architecture.md, screens 16, 17 and 21):
-- a fitting, a tasting, a venue visit. Kept apart from to-dos on purpose —
-- a to-do is ticked off, an appointment is attended, and squeezing one into
-- the other loses its time, its place and who you're meeting. The agenda
-- shows them side by side and filters them apart.
--
-- The date and time are stored as they're said ("3 Oct, 2:30pm"), not as a
-- moment in a time zone: an appointment is where you need to be, local time.

create table appointments (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  title       text not null,
  on_date     date not null,
  at_time     time,
  location    text,
  contact_id  uuid references contacts (id) on delete set null,
  area_key    text,
  notes       text,
  created_at  timestamptz not null default now()
);

create index on appointments (wedding_id, on_date);

alter table appointments enable row level security;

create policy "members read appointments" on appointments for select using (is_wedding_member(wedding_id));
create policy "hosts write appointments"  on appointments for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on appointments to authenticated;
