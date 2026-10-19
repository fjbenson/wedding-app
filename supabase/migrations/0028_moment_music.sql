-- Music on the run sheet (19 Oct 2026, owner's OK): a song or playlist for a
-- moment — the walk down the aisle, the entrance, the first dance — and a
-- link to it (Spotify, YouTube, Apple Music). The Music area page lists every
-- moment with music, ready to copy for the band or DJ.
--
-- Additive: two empty columns, nothing existing changes. Only the link is
-- stored; nothing is sent anywhere, and tapping it just opens it.

alter table run_sheet_items
  add column music text,
  add column music_url text check (music_url is null or music_url ~* '^https?://');
