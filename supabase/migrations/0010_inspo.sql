-- Inspo (docs/information-architecture.md, screens 29–33): the visual grid of
-- everything saved. Its folders ARE the areas — area_key, the same key
-- to-dos, suppliers and notes use — so a dress saved to Attire also shows on
-- the Attire area page. Null area_key is "Unsorted".
--
-- An item is an uploaded picture (image_path, in the private "inspo"
-- storage bucket), or a pasted link (url, with the preview picture the page
-- offers, if any, in image_url) — or both.

create table inspo_items (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  area_key    text,
  image_path  text,
  image_url   text,
  url         text,
  title       text,
  note        text,
  created_at  timestamptz not null default now(),
  check (image_path is not null or url is not null)
);

create index on inspo_items (wedding_id, area_key);

alter table inspo_items enable row level security;

create policy "members read inspo" on inspo_items for select using (is_wedding_member(wedding_id));
create policy "hosts write inspo"  on inspo_items for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on inspo_items to authenticated;

-- The pictures themselves. A private bucket: nothing in it is public, and
-- pictures are shown through short-lived signed links. Files live under the
-- wedding's id — inspo/<wedding id>/<file> — and the same member / host
-- rules apply to them as to the rows above. 10 MB a file, images only.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inspo', 'inspo', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "members see their wedding's inspo files" on storage.objects for select to authenticated
  using (bucket_id = 'inspo' and public.is_wedding_member(((storage.foldername(name))[1])::uuid));
create policy "hosts add inspo files" on storage.objects for insert to authenticated
  with check (bucket_id = 'inspo' and public.is_wedding_host(((storage.foldername(name))[1])::uuid));
create policy "hosts remove inspo files" on storage.objects for delete to authenticated
  using (bucket_id = 'inspo' and public.is_wedding_host(((storage.foldername(name))[1])::uuid));
