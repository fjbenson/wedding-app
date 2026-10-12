-- A supplier's website, so their card can have a Website button beside
-- Call and Email (owner's ask, 12 Oct 2026). Covered by the existing
-- supplier_details policies. Until this is run, the app quietly leaves the
-- website out rather than failing.

alter table supplier_details
  add column if not exists website text;

-- Tell Supabase's API about the new column straight away.
notify pgrst, 'reload schema';
