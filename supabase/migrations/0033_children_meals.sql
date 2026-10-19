-- Children, properly (19 Oct 2026, canvas 3 "Children · Round 1", C — owner's
-- pick): every guest has a meal (adult, child's, or none — a baby) and either
-- drinks alcohol or doesn't, because both decide what the caterer charges.
-- The Food & drink area can hold the caterer's prices a head, so the app can
-- work out what the food and drink will cost from the guest list.
--
-- Additive: two columns on guests (filled in from the old Child tick: a child
-- gets the child's meal and no alcohol), three empty price columns on areas.
-- Nothing is deleted; is_child stays and follows the meal.

alter table contacts add column meal_kind text not null default 'adult'
  check (meal_kind in ('adult', 'child', 'none'));
alter table contacts add column no_alcohol boolean not null default false;

update contacts set meal_kind = 'child', no_alcohol = true where is_child;

alter table areas add column price_adult  numeric check (price_adult  is null or price_adult  >= 0);
alter table areas add column price_child  numeric check (price_child  is null or price_child  >= 0);
alter table areas add column price_drinks numeric check (price_drinks is null or price_drinks >= 0);
