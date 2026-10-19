-- Who's in charge of a moment on the day (19 Oct 2026, owner's OK): one
-- supplier or guest picked from the wedding's own list — the band for the
-- first dance, Sam the usher for the entrance music. The typed `who` stays
-- for anyone not on the list. (0030's music_played / music_who are no longer
-- shown; left as they are, nothing deleted.)
--
-- Additive: one empty column. Only someone from the same wedding; removing
-- them leaves the moment, without them.

alter table run_sheet_items add column contact_id uuid;
alter table run_sheet_items
  add constraint run_sheet_items_contact_fk foreign key (contact_id, wedding_id)
  references contacts (id, wedding_id) on delete set null (contact_id);
create index on run_sheet_items (contact_id);
