-- How a moment's music is played (19 Oct 2026, owner's OK: "the main thing
-- with music is the technology"): a song or a playlist, who or what plays it
-- (the band, the DJ, the venue's speakers, our phone or laptop), and who
-- presses play.
--
-- Additive: three empty columns on run_sheet_items, nothing existing changes.

alter table run_sheet_items
  add column music_kind text check (music_kind in ('song', 'playlist')),
  add column music_played text check (music_played in ('band', 'dj', 'venue', 'device')),
  add column music_who text;
