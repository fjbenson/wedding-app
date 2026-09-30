-- The "key facts" block on an area page (docs/design-brief.md, "Area pages"):
-- deliberately one plain text field, the same for every area, so flowers and
-- cake share one template instead of growing their own forms.
-- Covered by the existing areas policies.

alter table areas add column if not exists details text;
