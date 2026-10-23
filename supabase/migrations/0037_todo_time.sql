-- A time on a to-do (owner, 23 Oct 2026): optional, like an appointment's.
-- "Ring the florist, 2pm". Local time, no time zone, only meaningful with a
-- due_date. `remind_at` stays for the old "start around" nudges.
-- No new table and no change to who can see what: milestones' row-level
-- security already covers the new column.

alter table milestones add column if not exists due_time time;
