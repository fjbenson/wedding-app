-- Run 18 Oct 2026 with the owner's OK.
--
-- The menu and the drinks (18 Oct 2026, canvas 3 "Food & drink · Round 1",
-- A and C). One menu for everyone: the day's courses (canapés, the wedding
-- breakfast, evening food…) each with its dishes, and the drinks through the
-- day with how much and who is supplying them.
--
-- Additive: three new tables, nothing existing changes. They hold no guest
-- details at all. Removing a course removes its dishes.

create table menu_courses (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),   -- "Canapés", "Wedding breakfast"
  serve_time  time,                                           -- optional
  note        text,                                           -- "on the lawn"
  evening     boolean not null default false,                 -- for evening guests too
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (id, wedding_id)
);

create table menu_dishes (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null,
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),
  tags        text[] not null default '{}',                   -- "V", "VG", "GF"
  instead     text,                                           -- "Vegetarians: mushroom wellington"
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  foreign key (course_id, wedding_id) references menu_courses (id, wedding_id) on delete cascade
);

create table drinks (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  name        text not null check (length(trim(name)) > 0),   -- "Arrival fizz"
  moment      text,                                           -- "Arrival", "With the meal", "Toast", "Evening bar"
  kind        text not null default 'other'
              check (kind in ('fizz', 'wine', 'beer', 'spirits', 'soft', 'hot', 'other')),
  serve_time  time,
  quantity    numeric check (quantity is null or quantity >= 0),
  unit        text,                                           -- "bottles", "cask"
  supplied_by text,                                           -- "Bar company", "Us"
  status      text not null default 'undecided'
              check (status in ('undecided', 'to_order', 'ordered', 'delivered')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index on menu_courses (wedding_id);
create index on menu_dishes (wedding_id);
create index on menu_dishes (course_id);
create index on drinks (wedding_id);

alter table menu_courses enable row level security;
alter table menu_dishes enable row level security;
alter table drinks enable row level security;

create policy "members read menu courses" on menu_courses for select using (is_wedding_member(wedding_id));
create policy "hosts write menu courses"  on menu_courses for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read menu dishes" on menu_dishes for select using (is_wedding_member(wedding_id));
create policy "hosts write menu dishes"  on menu_dishes for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

create policy "members read drinks" on drinks for select using (is_wedding_member(wedding_id));
create policy "hosts write drinks"  on drinks for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));
