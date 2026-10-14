-- Groups of guests (14 Oct 2026, canvas 3 "Groups · Round 1"): people who
-- belong together for some reason — "The football lot", "Staying at the
-- pub", "Mum's side". Unlike a household (one address, one invitation, one
-- per guest), a guest can be in any number of groups, and a group has no
-- address. Used to filter the guest list and to email or text a group.
--
-- Additive: two new tables, nothing existing changes. Removing a group never
-- removes its people; removing a guest takes them out of their groups.

create table guest_groups (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  created_at  timestamptz not null default now(),
  unique (wedding_id, name),
  unique (id, wedding_id)
);

-- Who's in each group. Both sides point at (id, wedding_id) pairs, so a group
-- can only ever hold guests of its own wedding (as seats and passengers do).
create table guest_group_members (
  group_id    uuid not null,
  contact_id  uuid not null,
  wedding_id  uuid not null references weddings (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (group_id, contact_id),
  foreign key (group_id, wedding_id) references guest_groups (id, wedding_id) on delete cascade,
  foreign key (contact_id, wedding_id) references contacts (id, wedding_id) on delete cascade
);

create index on guest_groups (wedding_id);
create index on guest_group_members (wedding_id);
create index on guest_group_members (contact_id);

alter table guest_groups enable row level security;
alter table guest_group_members enable row level security;

create policy "members read guest groups" on guest_groups for select using (is_wedding_member(wedding_id));
create policy "hosts write guest groups"  on guest_groups for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read group members" on guest_group_members for select using (is_wedding_member(wedding_id));
create policy "hosts write group members"  on guest_group_members for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
