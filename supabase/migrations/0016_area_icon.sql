-- Each area's own icon (owner, 12 Oct 2026): adding an area now asks for a
-- name, an icon and a budget, and the icon is its dot on the hub ring. Holds
-- the icon's name from src/lib/area-icons.ts (e.g. 'Flame'); empty means the
-- starter area's own icon, or the sparkle. Covered by the existing areas
-- policies. Until this is run, the app quietly leaves the icon out.

alter table areas
  add column if not exists icon text;

-- Tell Supabase's API about the new column straight away.
notify pgrst, 'reload schema';
