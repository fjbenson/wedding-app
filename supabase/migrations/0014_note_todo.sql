-- A note that's been made into a to-do stays on the notes wall with a
-- "To-do" tag that opens it (owner's call, 11 Oct 2026), rather than
-- disappearing. This remembers which to-do it became. Removing the to-do
-- just clears the link; the note stays. Covered by the existing notes
-- policies.

alter table notes
  add column if not exists milestone_id uuid references milestones (id) on delete set null;
