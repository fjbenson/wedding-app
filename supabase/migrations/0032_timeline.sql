-- The timeline (19 Oct 2026, owner's OK; canvas 3 "History · Round 2" and
-- "Timeline · Round 3"): everything with a supplier, guest, household or
-- area, past and to come. Payments, to-dos, appointments and files are
-- already stored and are only read; this adds the one thing that wasn't —
-- what was said and sent: a call, a meeting, an email, a message, a note,
-- a save the date or invitation going out, and (written by the app) a
-- supplier reaching Quote in or Booked.
--
-- Owner's calls: an email sent from your own mail app keeps its subject,
-- who and when, never the message; nothing is sent anywhere; the assistant
-- isn't given any of it.
--
-- Additive: one new table, one empty column on to-dos (the call a to-do came
-- from), and a uniqueness rule on households that's already true.

alter table households add constraint households_id_wedding unique (id, wedding_id);

create table timeline_entries (
  id            uuid primary key default gen_random_uuid(),
  wedding_id    uuid not null references weddings (id) on delete cascade,
  kind          text not null check (kind in
                  ('call', 'meeting', 'email', 'message', 'note',
                   'save_the_date', 'invitation', 'thank_you', 'stage')),
  happened_on   date not null default current_date,
  summary       text,                                -- what was said / "Booked"
  how           text check (how in ('email', 'post', 'hand', 'text')),
  -- Who it's with: one of these, or just an area.
  contact_id    uuid,
  household_id  uuid,
  group_id      uuid,
  area_key      text,
  created_at    timestamptz not null default now(),
  unique (id, wedding_id),
  -- Only someone from this same wedding; removing them removes their entries.
  foreign key (contact_id, wedding_id)   references contacts (id, wedding_id)     on delete cascade,
  foreign key (household_id, wedding_id) references households (id, wedding_id)   on delete cascade,
  foreign key (group_id, wedding_id)     references guest_groups (id, wedding_id) on delete cascade
);

create index on timeline_entries (wedding_id, happened_on);
create index on timeline_entries (contact_id);
create index on timeline_entries (household_id);
create index on timeline_entries (group_id);

-- A to-do that came out of a call or meeting remembers it.
alter table milestones add column timeline_entry_id uuid;
alter table milestones
  add constraint milestones_timeline_entry_fk foreign key (timeline_entry_id, wedding_id)
  references timeline_entries (id, wedding_id) on delete set null (timeline_entry_id);
create index on milestones (timeline_entry_id);

alter table timeline_entries enable row level security;

create policy "members read timeline" on timeline_entries for select using (is_wedding_member(wedding_id));
create policy "hosts write timeline"  on timeline_entries for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on timeline_entries to authenticated;
