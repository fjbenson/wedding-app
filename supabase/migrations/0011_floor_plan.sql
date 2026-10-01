-- Seating floor plan (docs/design-brief.md, screen 26): where each table
-- stands in the room, and whether it's round or long.
--
-- Positions are the table's centre as a percentage of the room's width and
-- height (0–100), so the plan scales to any screen. Null means "never moved":
-- the app lays those out in a tidy grid until someone drags them.

alter table seating_tables
  add column pos_x real check (pos_x between 0 and 100),
  add column pos_y real check (pos_y between 0 and 100),
  add column shape text not null default 'round' check (shape in ('round', 'long'));
