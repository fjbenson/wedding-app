-- 0036_floor_plan_wider.sql — tables may stand outside the room (owner, 21 Oct 2026:
-- "zoom out and more canvas becomes available").
--
-- A table's position is saved as a % of the room (0011). The check only let
-- that be 0–100, so a table could never leave the room. This widens it to
-- −300 … 400 (about three room-widths each way). It changes no existing row:
-- every table already placed has a value inside the new range. Nothing is
-- deleted. The floor plan and the venue PDF fit themselves to wherever the
-- tables are.

alter table public.seating_tables
  drop constraint if exists seating_tables_pos_x_check,
  drop constraint if exists seating_tables_pos_y_check;

alter table public.seating_tables
  add constraint seating_tables_pos_x_check check (pos_x between -300 and 400),
  add constraint seating_tables_pos_y_check check (pos_y between -300 and 400);
