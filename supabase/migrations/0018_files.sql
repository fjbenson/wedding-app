-- Files (owner, 13 Oct 2026; canvas 2 "Files · Round 1", option A with the
-- phone's own picker, C): contracts, quotes, invoices and receipts kept in
-- the app. Each belongs to the wedding and usually to a supplier
-- (contact_id) and an area (area_key, the same key everything else uses).
--
-- The file itself sits in the private "files" storage bucket under the
-- wedding's id — files/<wedding id>/<file> — shown through short-lived signed
-- links, like Inspo's pictures. Nothing existing changes.

create table files (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references weddings (id) on delete cascade,
  contact_id  uuid,
  area_key    text,
  kind        text not null default 'other' check (kind in ('contract', 'quote', 'invoice', 'receipt', 'other')),
  signed      boolean not null default false,
  name        text not null,
  path        text not null,
  size_bytes  integer,
  mime_type   text,
  created_at  timestamptz not null default now(),
  -- Only a supplier of the same wedding; if they're removed, the file stays
  -- (with no supplier) rather than vanishing.
  foreign key (contact_id, wedding_id) references contacts (id, wedding_id) on delete set null (contact_id)
);

create index on files (wedding_id, contact_id);

alter table files enable row level security;

create policy "members read files" on files for select using (is_wedding_member(wedding_id));
create policy "hosts write files"  on files for all
  using (is_wedding_host(wedding_id)) with check (is_wedding_host(wedding_id));

grant select, insert, update, delete on files to authenticated;

-- 20 MB a file: PDFs, photos and Word documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('files', 'files', false, 20971520, array[
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])
on conflict (id) do nothing;

create policy "members see their wedding's files" on storage.objects for select to authenticated
  using (bucket_id = 'files' and public.is_wedding_member(((storage.foldername(name))[1])::uuid));
create policy "hosts add files" on storage.objects for insert to authenticated
  with check (bucket_id = 'files' and public.is_wedding_host(((storage.foldername(name))[1])::uuid));
create policy "hosts remove files" on storage.objects for delete to authenticated
  using (bucket_id = 'files' and public.is_wedding_host(((storage.foldername(name))[1])::uuid));
