-- A guest's role on the day — bridesmaid, best man, usher, reader…
-- (docs/information-architecture.md, "Bridal party roles").
--
-- Free text, so a couple can write "Maid of honour" or "Chief dog handler".
-- A guest with a role is also marked contact_type = 'bridal_party' by the app,
-- which is what the plan's bridal-party view will filter on.
-- Covered by the existing contacts policies; nothing new to secure.

alter table contacts add column if not exists role_on_the_day text;
