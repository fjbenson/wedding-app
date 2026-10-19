-- Run 19 Oct 2026 with the owner's OK.
--
-- Which chair a guest sits in (19 Oct 2026, owner: "you're choosing a
-- specific chair on the map"). Until now a seat only said which table; the
-- close-up drew people round it in name order. Now each seat can say which
-- chair, counted from 1 clockwise from the top (down the first side, then the
-- second, on a long table).
--
-- Additive: one column, empty for everyone already seated (they fill the
-- free chairs in name order, as before). No guest details, no policy change
-- (seats' policies already cover every column). Two people can't share a
-- chair at one table.

alter table seats add column seat_no smallint check (seat_no >= 1);

create unique index seats_one_per_chair on seats (table_id, seat_no) where seat_no is not null;
