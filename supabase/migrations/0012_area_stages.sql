-- The area page's five stages (Dream · Compare · Book · Pay · Ready), settled
-- on the design canvas, "Area page · Round 4", 7 Oct 2026.
--
-- Most of a stage is worked out from what's already recorded: a quote in,
-- a supplier booked, everything paid. This adds the little that isn't:
--
-- * a supplier stage for "they've given us a price" ('quoted'), between
--   asked ('enquired') and 'booked'. 'cancelled' now reads "Not taken".
-- * "Looking" ('researching') folds into "Asked": existing rows move over.
-- * areas.diy — "we're doing this ourselves", which skips Compare and Book.
-- * areas.ready — the last stage, the one the couple ticks themselves.
--
-- Covered by the existing supplier_details and areas policies.

alter type supplier_status add value if not exists 'quoted' after 'enquired';

update supplier_details set status = 'enquired' where status = 'researching';
alter table supplier_details alter column status set default 'enquired';

alter table areas add column if not exists diy boolean not null default false;
alter table areas add column if not exists ready boolean not null default false;
