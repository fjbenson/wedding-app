-- Each run sheet moment can belong to an area (owner, 12 Oct 2026), so an
-- area page shows its part of the day and the run sheet can be narrowed to
-- one area. Holds the area's key, like milestones.category; empty means
-- Other. Covered by the existing run_sheet_items policies. Until this is
-- run, the app quietly leaves the area out.

alter table run_sheet_items
  add column if not exists area_key text;

-- Tell Supabase's API about the new column straight away.
notify pgrst, 'reload schema';
