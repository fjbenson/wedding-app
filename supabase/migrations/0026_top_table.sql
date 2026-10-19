-- Run 19 Oct 2026 with the owner's OK.
--
-- A third table shape: the top table (owner, 19 Oct 2026: "top table is
-- different to long because you only need chairs down one side"). Its
-- chairs sit along one side, facing the room.
--
-- Additive: one more allowed word for seating_tables.shape. No guest
-- details, no existing table changes.

alter table seating_tables drop constraint seating_tables_shape_check;
alter table seating_tables add constraint seating_tables_shape_check check (shape in ('round', 'long', 'top'));
