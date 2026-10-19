-- Food & drink through the day, and a schedule for each group (19 Oct 2026,
-- canvas 3 "Food & drink · Round 2", A + C — owner's pick).
--
-- A: a course of the menu, or a drink, can belong to a moment of the run
-- sheet (the wedding breakfast at 17:00), so Food & drink's page reads as the
-- day's food and drink moments, like Music. Dishes can be marked as the
-- children's menu.
-- C: a moment can be for one or more groups of guests (the bridesmaids, the
-- groomsmen), so the run sheet can be narrowed to that group's own schedule.
--
-- Additive: three empty columns and one link table. Courses already named
-- like a food moment (the demo's "Wedding breakfast") are linked to it.
-- Only things from the same wedding can be linked; removing a moment leaves
-- its courses and drinks, unlinked; removing a group or moment removes the link.

alter table run_sheet_items add constraint run_sheet_items_id_wedding unique (id, wedding_id);

alter table menu_courses add column moment_id uuid;
alter table menu_courses
  add constraint menu_courses_moment_fk foreign key (moment_id, wedding_id)
  references run_sheet_items (id, wedding_id) on delete set null (moment_id);
create index on menu_courses (moment_id);

alter table drinks add column moment_id uuid;
alter table drinks
  add constraint drinks_moment_fk foreign key (moment_id, wedding_id)
  references run_sheet_items (id, wedding_id) on delete set null (moment_id);
create index on drinks (moment_id);

alter table menu_dishes add column for_children boolean not null default false;

create table run_sheet_groups (
  moment_id   uuid not null,
  group_id    uuid not null,
  wedding_id  uuid not null references weddings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (moment_id, group_id),
  foreign key (moment_id, wedding_id) references run_sheet_items (id, wedding_id) on delete cascade,
  foreign key (group_id, wedding_id)  references guest_groups (id, wedding_id)    on delete cascade
);
create index on run_sheet_groups (wedding_id);
create index on run_sheet_groups (group_id);

alter table run_sheet_groups enable row level security;
create policy "members read moment groups" on run_sheet_groups for select using (is_wedding_member(wedding_id));
create policy "hosts write moment groups"  on run_sheet_groups for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
grant select, insert, update, delete on run_sheet_groups to authenticated;

-- Link courses to a food moment of the same name, where there is one.
update menu_courses c set moment_id = r.id
from run_sheet_items r
where r.wedding_id = c.wedding_id
  and c.moment_id is null
  and lower(trim(r.title)) = lower(trim(c.name));
