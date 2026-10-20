-- More than one run sheet (20 Oct 2026, canvas 3 "Run sheets · Round 1", the
-- owner's idea: a bridesmaids' morning is detailed — hair and make-up for each
-- bridesmaid — and doesn't belong on the main run sheet).
--
-- "The day" stays the one main run sheet: a moment with no sheet is on it, so
-- every moment you have now is still there. A new run sheet (Bridesmaids,
-- Groomsmen, the photographer's list) has a name, optionally a group of
-- guests it is for (so it can be emailed to them), and its own moments.
-- A moment lives on one sheet; copying it to another makes a second moment.
--
-- Additive: one table and one nullable column. Only a sheet and a moment from
-- the same wedding can be linked, and a sheet can only point at the same
-- wedding's group. Removing a group leaves the sheet (just no longer tied to
-- it); removing a sheet removes its moments (the app asks first).
--
-- The groups' schedules from 0034 (a moment tagged "for" a group) become
-- run sheets: each group with tagged moments gets a sheet of its name, tied to
-- it, and the tagged moments move onto it (a moment tagged for two groups
-- moves to the first and is copied to the other). The tags themselves are left
-- in place, no longer used.

create table run_sheets (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null,
  group_id    uuid,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (id, wedding_id),
  foreign key (group_id, wedding_id) references guest_groups (id, wedding_id) on delete set null (group_id)
);
create index on run_sheets (wedding_id);

alter table run_sheets enable row level security;
create policy "members read run sheets" on run_sheets for select using (is_wedding_member(wedding_id));
create policy "hosts write run sheets"  on run_sheets for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
grant select, insert, update, delete on run_sheets to authenticated;

alter table run_sheet_items add column sheet_id uuid;
alter table run_sheet_items
  add constraint run_sheet_items_sheet_fk foreign key (sheet_id, wedding_id)
  references run_sheets (id, wedding_id) on delete cascade;
create index on run_sheet_items (sheet_id);

-- Each group that has moments "for" it becomes a run sheet tied to that group.
insert into run_sheets (wedding_id, name, group_id, sort_order)
select g.wedding_id, g.name, g.id, (row_number() over (partition by g.wedding_id order by g.name))::int
from guest_groups g
where exists (select 1 from run_sheet_groups rg where rg.group_id = g.id and rg.wedding_id = g.wedding_id);

-- A tagged moment moves onto the sheet of the first group it is tagged for…
update run_sheet_items i set sheet_id = s.sheet_id
from (
  select distinct on (rg.moment_id) rg.moment_id, rs.id as sheet_id
  from run_sheet_groups rg
  join run_sheets rs on rs.group_id = rg.group_id and rs.wedding_id = rg.wedding_id
  order by rg.moment_id, rs.name
) s
where i.id = s.moment_id;

-- …and is copied to the sheet of any other group it is for.
insert into run_sheet_items (wedding_id, at_time, title, location, who, notes, area_key, music, music_url, music_kind, music_played, music_who, contact_id, sheet_id)
select i.wedding_id, i.at_time, i.title, i.location, i.who, i.notes, i.area_key, i.music, i.music_url, i.music_kind, i.music_played, i.music_who, i.contact_id, rs.id
from run_sheet_groups rg
join run_sheet_items i on i.id = rg.moment_id and i.wedding_id = rg.wedding_id
join run_sheets rs on rs.group_id = rg.group_id and rs.wedding_id = rg.wedding_id
where rs.id <> i.sheet_id;
