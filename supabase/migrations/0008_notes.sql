-- Quick capture and the inbox (docs/information-architecture.md, screens 35
-- and 36): a thought, or a link, jotted from anywhere. `area_key` is null
-- until it's filed, which is what puts it in the inbox; filed, it shows on
-- that area's page. Images come later (they need Supabase Storage).

create table notes (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  area_key    text,
  body        text,
  url         text,
  created_at  timestamptz not null default now(),
  check (body is not null or url is not null)
);

create index on notes (wedding_id, area_key);

alter table notes enable row level security;

create policy "members read notes" on notes for select using (is_wedding_member(wedding_id));
create policy "hosts write notes"  on notes for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on notes to authenticated;
