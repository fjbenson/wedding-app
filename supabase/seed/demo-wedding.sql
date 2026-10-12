-- Demo wedding: Olivia & Theo (12 Oct 2026). Every name, address, phone
-- number and business here is made up (phone numbers are in Ofcom's
-- 07700 900xxx drama range; emails are @example.com), so it's safe to
-- screenshot.
--
-- Run in the Supabase SQL editor (or by Claude with the owner's OK). It
-- first DELETES any earlier "Olivia & Theo" demo wedding for this login, and
-- everything hanging off it, then builds it fresh — so running it again
-- resets the demo. Nothing else is touched.
--
-- v_user is the login that gets the demo (the owner's). Change it to give
-- the demo to someone else.

do $$
declare
  v_user uuid := '86604270-61ba-4dc9-b7db-ab4d50e34b33';
  w uuid; e_day uuid; e_eve uuid; h uuid; inv uuid; c uuid;
begin
  delete from weddings where name = 'Olivia & Theo' and created_by = v_user;

  insert into weddings (name, wedding_date, created_by, budget)
  values ('Olivia & Theo', '2027-06-12', v_user, 28000) returning id into w;
  insert into wedding_members (wedding_id, user_id, role) values (w, v_user, 'owner');

  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'venue', 'Venue', true, true, 0, 9000, '- Ceremony room seats 120
- Drinks on the lawn, marquee if wet
- Last orders 23:30, carriages midnight
- Confetti outside only (biodegradable)');
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'photography', 'Photos', true, true, 1, 2500, '- Ellie Rose: 10 hours, from prep to first dance
- Shot list: grandparents, the barn at golden hour');
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'food', 'Food & drink', true, true, 2, 7000, '- Three courses, choice of three mains
- Evening: wood-fired pizza at 21:30
- Corkage £8 a bottle');
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'flowers', 'Flowers', true, true, 3, 2000, '- Wild, meadowy, nothing too neat
- Bouquet, 4 bridesmaids, 6 buttonholes, 10 tables');
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'cake', 'Cake', true, true, 4, 500, null);
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'music', 'Music', true, true, 5, 2000, '- Band 19:30–23:30, two 45-minute sets
- First dance: ''Harvest Moon''');
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'attire', 'Attire', true, true, 6, 2800, null);
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'hair-makeup', 'Hair & makeup', true, true, 7, 600, null);
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'stationery', 'Stationery', true, true, 8, 500, '- Save-the-dates sent September
- Invitations out by 12 March');
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details) values (w, 'transport', 'Transport', true, true, 9, 900, null);

  insert into events (wedding_id, name, starts_at, location) values (w, 'The day', '2027-06-12 13:30+01', 'Ashcombe Barn') returning id into e_day;
  insert into events (wedding_id, name, starts_at, location) values (w, 'The evening', '2027-06-12 19:30+01', 'Ashcombe Barn') returning id into e_eve;

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Bennetts', '14 Orchard Lane', 'Cheltenham', 'GL52 3AB', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Claire', 'Bennett', 'claire.bennett@example.com', '07700 900107', false, 'Mother of the bride') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', null, '2026-10-09');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-09');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Richard', 'Bennett', 'richard.bennett@example.com', null, false, 'Father of the bride') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', null, null, '2026-10-04');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-04');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Hales', '3 Mill Close', 'Bath', 'BA2 4QT', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Fiona', 'Hale', 'fiona.hale@example.com', null, false, 'Mother of the groom') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', 'Gluten-free', '2026-10-09');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-09');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Martin', 'Hale', 'martin.hale@example.com', '07700 900114', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', null, '2026-10-01');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-01');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Grace Whitfield', 'Flat 2, 41 Park Street', 'Bristol', 'BS1 5NG', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Grace', 'Whitfield', 'grace.whitfield@example.com', '07700 900121', false, 'Maid of honour') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', null, 'Vegetarian', '2026-10-01');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-01');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Oscar Hale', '22 Kingsdown Parade', 'Bristol', 'BS6 5UE', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Oscar', 'Hale', null, '07700 900128', false, 'Best man') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Wild mushroom risotto', null, '2026-10-02');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-02');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Priya & Tom', '8 Rosemary Gardens', 'London', 'SE15 4RT', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Priya', 'Shah', 'priya.shah@example.com', '07700 900135', false, 'Bridesmaid') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', 'Vegetarian', '2026-10-04');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-04');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Tom', 'Ellis', 'tom.ellis@example.com', '07700 900142', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', null, '2026-10-04');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-04');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Hannah Cole', '17 Victoria Road', 'Oxford', 'OX2 7QD', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Hannah', 'Cole', 'hannah.cole@example.com', '07700 900149', false, 'Bridesmaid') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', 'Dairy-free', '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Moores', '5 Church View', 'Stroud', 'GL5 1HD', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Sophie', 'Moore', 'sophie.moore@example.com', '07700 900156', false, 'Bridesmaid') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', null, '2026-10-02');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-02');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Ben', 'Moore', 'ben.moore@example.com', '07700 900163', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', null, null, '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Isla', 'Moore', null, null, true, 'Flower girl') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Children''s menu', null, '2026-10-05');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-05');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Alfie', 'Moore', null, null, true, 'Page boy') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Children''s menu', 'Nut allergy', '2026-10-02');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-02');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Jack & Ellie', '29 Hampton Road', 'Bristol', 'BS6 6HP', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Jack', 'Turner', 'jack.turner@example.com', null, false, 'Groomsman') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', null, '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Ellie', 'Turner', 'ellie.turner@example.com', '07700 900170', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Wild mushroom risotto', 'Vegan', '2026-10-06');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-06');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Sam Okafor', '11 Cotham Hill', 'Bristol', 'BS6 6LA', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'bridal_party', 'Sam', 'Okafor', 'sam.okafor@example.com', '07700 900177', false, 'Groomsman') returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', null, '2026-10-02');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-02');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Granny Bennett', 'The Willows, Sheep Street', 'Burford', 'OX18 4LS', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Margaret', 'Bennett', 'margaret.bennett@example.com', '07700 900184', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', 'Soft food', '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Patels', '62 Elm Grove', 'Reading', 'RG1 5HN', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Anil', 'Patel', null, '07700 900191', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', 'Vegetarian', '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Meera', 'Patel', 'meera.patel@example.com', '07700 900198', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', 'Vegetarian', '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Riya', 'Patel', null, null, true, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Children''s menu', null, '2026-10-06');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-06');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Harts', '4 Station Approach', 'Cirencester', 'GL7 1AE', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Amelia', 'Hart', null, null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', null, '2026-10-03');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-03');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Daniel', 'Hart', 'daniel.hart@example.com', '07700 900205', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', null, null, '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Uncle Pete & Aunt Jo', '19 Ferry Lane', 'Tewkesbury', 'GL20 5BA', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Peter', 'Hale', 'peter.hale@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', null, '2026-10-07');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-07');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Jo', 'Hale', 'jo.hale@example.com', '07700 900212', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', 'Gluten-free', '2026-10-07');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-07');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Carters', '7 Beech Avenue', 'Swindon', 'SN1 4EF', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Ben', 'Carter', 'ben.carter@example.com', '07700 900219', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Lucy', 'Carter', 'lucy.carter@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Chloe Price', '33 Queens Road', 'Cardiff', 'CF10 3NP', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Chloe', 'Price', 'chloe.price@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', null, '2026-10-05');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-05');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Nguyens', '12 Marlborough Hill', 'Bristol', 'BS2 8EZ', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Linh', 'Nguyen', 'linh.nguyen@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Wild mushroom risotto', 'Shellfish allergy', '2026-10-06');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-06');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'David', 'Nguyen', 'david.nguyen@example.com', '07700 900226', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Wild mushroom risotto', null, '2026-10-01');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-01');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Dan Okafor', '50 Gloucester Road', 'Bristol', 'BS7 8NN', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Dan', 'Okafor', 'dan.okafor@example.com', '07700 900233', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'declined', null, null, '2026-10-09');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'declined', null, null, '2026-10-09');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Fletchers', '2 Abbey Mews', 'Malmesbury', 'SN16 9AS', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Rose', 'Fletcher', 'rose.fletcher@example.com', '07700 900240', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Wild mushroom risotto', null, '2026-10-07');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-07');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'James', 'Fletcher', null, null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', null, '2026-10-02');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-02');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Poppy', 'Fletcher', null, null, true, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Children''s menu', null, '2026-10-06');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-06');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Laura & Mike', '45 Wells Road', 'Bath', 'BA2 3AP', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Laura', 'Grant', null, '07700 900247', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Mike', 'Grant', 'mike.grant@example.com', '07700 900254', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Zara Ahmed', '9 Clifton Vale', 'Bristol', 'BS8 4PT', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Zara', 'Ahmed', 'zara.ahmed@example.com', '07700 900261', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', 'No pork', '2026-10-07');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-07');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Wrights', '88 High Street', 'Marlborough', 'SN8 1HF', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Helen', 'Wright', 'helen.wright@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', null, '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Graham', 'Wright', 'graham.wright@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', null, null, '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Kate Lawson', '15 Kings Road', 'Brighton', 'BN1 2FN', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Kate', 'Lawson', 'kate.lawson@example.com', '07700 900268', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'declined', null, null, '2026-10-03');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'declined', null, null, '2026-10-03');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Hughes', '6 Meadow Way', 'Monmouth', 'NP25 3EP', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Rhys', 'Hughes', 'rhys.hughes@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Bethan', 'Hughes', 'bethan.hughes@example.com', '07700 900275', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Osian', 'Hughes', null, null, true, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Ella Moss', '21 Albion Street', 'Cheltenham', 'GL52 2LP', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Ella', 'Moss', null, null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', null, null, '2026-10-09');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-09');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Finn', 'Doyle', 'finn.doyle@example.com', '07700 900282', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', null, null, '2026-10-09');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-09');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Ashworths', '3 Quarry Road', 'Frome', 'BA11 1QD', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Nina', 'Ashworth', 'nina.ashworth@example.com', '07700 900289', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', 'Pescatarian', '2026-10-09');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-09');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Paul', 'Ashworth', 'paul.ashworth@example.com', '07700 900296', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Wild mushroom risotto', null, '2026-10-09');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-09');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Tilly & Jess', '10 Raleigh Road', 'Bristol', 'BS3 1QR', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Tilly', 'Brooks', 'tilly.brooks@example.com', '07700 900303', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Jess', 'Marsh', 'jess.marsh@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The O''Briens', '27 Harbour View', 'Cork', 'T12 X2N4', 'Ireland') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Aoife', 'O''Brien', 'aoife.obrien@example.com', '07700 900310', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Conor', 'O''Brien', 'conor.obrien@example.com', '07700 900317', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Leo Grant', '14 Charlotte Street', 'London', 'W1T 2LX', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Leo', 'Grant', 'leo.grant@example.com', '07700 900324', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', null, '2026-10-01');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-01');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Stantons', '1 Vicarage Lane', 'Painswick', 'GL6 6XP', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Hugh', 'Stanton', 'hugh.stanton@example.com', '07700 900331', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'declined', null, null, '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'declined', null, null, '2026-10-08');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Pam', 'Stanton', 'pam.stanton@example.com', '07700 900338', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'declined', null, null, '2026-10-06');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'declined', null, null, '2026-10-06');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Maya Robinson', '52 St Michael''s Hill', 'Bristol', 'BS2 8DX', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Maya', 'Robinson', 'maya.robinson@example.com', '07700 900345', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', null, 'Vegan', '2026-10-06');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-06');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Kellys', '18 Riverside', 'Gloucester', 'GL1 2QR', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, null) returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Sean', 'Kelly', null, null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'to_invite', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'to_invite', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Niamh', 'Kelly', 'niamh.kelly@example.com', '07700 900352', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'to_invite', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'to_invite', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Ruby Evans', '4 Bridge Street', 'Chepstow', 'NP16 5EZ', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Ruby', 'Evans', 'ruby.evans@example.com', '07700 900359', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Beef wellington', null, '2026-10-08');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Lowes', '31 Grove Park', 'Bath', 'BA1 3RD', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Simon', 'Lowe', 'simon.lowe@example.com', '07700 900366', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Wild mushroom risotto', null, '2026-10-02');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-02');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Anna', 'Lowe', 'anna.lowe@example.com', '07700 900373', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'attending', 'Sea bass', 'Gluten-free', '2026-10-03');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-03');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Callum Reid', '7 Leith Walk', 'Edinburgh', 'EH6 8LP', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Callum', 'Reid', 'callum.reid@example.com', '07700 900380', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_day, 'pending', null, null, null);
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Work friends · Olivia', null, null, null, null) returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Harriet', 'Shaw', 'harriet.shaw@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-07');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Josh', 'Bell', 'josh.bell@example.com', '07700 900387', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-02');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Amira', 'Haddad', 'amira.haddad@example.com', '07700 900394', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, 'Vegetarian', '2026-10-03');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Will', 'Parsons', 'will.parsons@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-08');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Work friends · Theo', null, null, null, null) returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Kieran', 'Doyle', null, '07700 900401', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Freya', 'Lund', 'freya.lund@example.com', '07700 900408', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Marcus', 'Webb', 'marcus.webb@example.com', '07700 900415', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'pending', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'The Greens', '40 Stokes Croft', 'Bristol', 'BS1 3QD', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Tess', 'Green', null, '07700 900422', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-01');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Alex', 'Green', 'alex.green@example.com', '07700 900429', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-02');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Neighbours', '16 Orchard Lane', 'Cheltenham', 'GL52 3AB', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Jean', 'Porter', 'jean.porter@example.com', '07700 900436', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-07');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Colin', 'Porter', 'colin.porter@example.com', '07700 900443', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-04');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Football lot', null, null, null, null) returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, null) returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Rob', 'Hayes', 'rob.hayes@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'to_invite', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Ollie', 'Stone', 'ollie.stone@example.com', '07700 900450', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'to_invite', null, null, null);

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Dev', 'Mistry', 'dev.mistry@example.com', '07700 900457', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'to_invite', null, null, null);

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Evie Clarke', '3 Southville Road', 'Bristol', 'BS3 1DG', 'United Kingdom') returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Evie', 'Clarke', null, '07700 900464', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'declined', null, null, '2026-10-06');

  insert into households (wedding_id, name, address_line1, city, postcode, country) values (w, 'Yoga friends', null, null, null, null) returning id into h;
  insert into invitations (wedding_id, household_id, sent_at) values (w, h, '2026-09-20') returning id into inv;
  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Lena', 'Fischer', 'lena.fischer@example.com', '07700 900471', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, 'Vegan', '2026-10-09');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, h, 'guest', 'Sasha', 'Ivanova', 'sasha.ivanova@example.com', '07700 900478', false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, inv, c, e_eve, 'attending', null, null, '2026-10-09');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, null, 'guest', 'Arthur', 'Bennett', 'arthur.bennett@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, null, c, e_day, 'attending', 'Beef wellington', null, '2026-10-09');
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, null, c, e_eve, 'attending', null, null, '2026-10-09');

  insert into contacts (wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day) values (w, null, 'guest', 'Nora', 'Quinn', 'nora.quinn@example.com', null, false, null) returning id into c;
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at) values (w, null, c, e_eve, 'pending', null, null, null);

  -- Suppliers
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Sarah', 'Lyle', 'hello@ashcombebarn.example.com', '07700 900485') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Ashcombe Barn', 'venue', 'booked', 9500, 2000, 'ashcombebarn.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Tom', 'Avery', 'tom@example.com', '07700 900492') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'The Old Rectory', 'venue', 'cancelled', 8200, 0, null);
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Ellie', 'Rose', 'hello@ellierose.example.com', '07700 900499') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Ellie Rose Photography', 'photography', 'booked', 2200, 500, 'ellierose.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Tom', 'Hart', 'hello@northlight.example.com', '07700 900506') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Northlight Studio', 'photography', 'quoted', 1950, 0, 'northlight.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Hannah', 'Price', 'hello@forkandfield.example.com', '07700 900513') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Fork & Field', 'food', 'booked', 6800, 1000, 'forkandfield.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Mia', 'Collins', 'hello@wildandgather.example.com', '07700 900520') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Wild & Gather', 'flowers', 'quoted', 1800, 0, 'wildandgather.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Josie', 'Ward', null, '07700 900527') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Petal & Stem', 'flowers', 'quoted', 2400, 0, null);
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Jo', 'Barnes', 'jo@example.com', null) returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Sugar Loft', 'cake', 'enquired', null, 0, null);
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Luke', 'Fraser', 'hello@velvetnotes.example.com', '07700 900534') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'The Velvet Notes', 'music', 'booked', 1600, 400, 'velvetnotes.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Sam', 'Avery', null, '07700 900541') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'DJ Sam Avery', 'music', 'quoted', 650, 0, null);
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Clara', 'Moss', 'hello@ivoryandlace.example.com', '07700 900548') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Ivory & Lace Bridal', 'attire', 'booked', 1800, 900, 'ivoryandlace.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'George', 'Hardy', 'george@example.com', '07700 900555') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Hardy & Sons', 'attire', 'booked', 650, 650, null);
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Mia', 'Daniels', 'mia@example.com', '07700 900562') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Glow by Mia', 'hair-makeup', 'quoted', 480, 0, null);
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Rachel', 'Lin', 'hello@paperandpost.example.com', '07700 900569') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Paper & Post Co.', 'stationery', 'booked', 420, 420, 'paperandpost.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Phil', 'Morgan', 'hello@cotswoldclassic.example.com', '07700 900576') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Cotswold Classic Cars', 'transport', 'booked', 450, 100, 'cotswoldclassic.example.com');
  insert into contacts (wedding_id, contact_type, first_name, last_name, email, phone) values (w, 'supplier', 'Dawn', 'Riley', 'dawn@example.com', '07700 900583') returning id into c;
  insert into supplier_details (contact_id, company_name, category, status, quoted_cost, deposit_paid, website) values (c, 'Swift Coaches', 'transport', 'booked', 380, 0, null);
  update weddings set venue_contact_id = (select contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ashcombe Barn') where id = w;
  -- Payments
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Venue instalment', 3000, '2026-12-01', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ashcombe Barn';
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Venue balance', 4500, '2027-05-12', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ashcombe Barn';
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Photography balance', 1700, '2027-05-29', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ellie Rose Photography';
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Catering instalment', 2900, '2027-02-01', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Fork & Field';
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Catering balance', 2900, '2027-05-29', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Fork & Field';
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Band balance', 1200, '2027-05-12', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'The Velvet Notes';
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Dress balance', 900, '2027-03-15', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ivory & Lace Bridal';
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Wedding car balance', 350, '2027-06-01', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Cotswold Classic Cars';
  insert into payments (wedding_id, contact_id, description, amount, due_date, paid_on) select w, sd.contact_id, 'Coach hire', 380, '2027-06-01', null from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Swift Coaches';
  insert into payments (wedding_id, area_key, description, amount, due_date, paid_on) values (w, null, 'Giving notice at the register office', 70, '2026-09-14', '2026-09-14');
  insert into payments (wedding_id, area_key, description, amount, due_date, paid_on) values (w, 'stationery', 'Save-the-date postage', 48, '2026-09-18', '2026-09-18');
  insert into payments (wedding_id, area_key, description, amount, due_date, paid_on) values (w, 'attire', 'Wedding rings', 1250, '2027-04-01', null);
  insert into payments (wedding_id, area_key, description, amount, due_date, paid_on) values (w, 'venue', 'Ceremony fee', 600, '2026-11-20', null);
  insert into payments (wedding_id, area_key, description, amount, due_date, paid_on) values (w, null, 'Honeymoon deposit', 500, '2026-10-08', null);
  -- To-dos
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Start looking at venues', 'venue', '2026-02-17', 'done', '2026-02-17 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Set the budget', null, '2026-03-19', 'done', '2026-03-19 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Book the venue', 'venue', '2026-04-18', 'done', '2026-04-18 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Draw up the guest list', null, '2026-05-18', 'done', '2026-05-18 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Book the photographer', 'photography', '2026-06-17', 'done', '2026-06-17 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Book the caterer', 'food', '2026-07-07', 'done', '2026-07-07 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Choose the dress', 'attire', '2026-08-16', 'done', '2026-08-16 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Send save-the-dates', 'stationery', '2026-09-15', 'done', '2026-09-15 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Book the band', 'music', '2026-10-05', 'done', '2026-10-05 12:00+00');
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Book the florist', 'flowers', '2026-10-20', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Choose a cake maker', 'cake', '2026-11-04', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Book hair and make-up', 'hair-makeup', '2026-11-14', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Sort a block of hotel rooms', null, '2026-11-24', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Book the honeymoon', null, '2026-10-15', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Choose the readings', null, '2027-01-13', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Theo''s suit fitting', 'attire', '2027-02-12', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Order the cake', 'cake', '2027-01-13', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Send the invitations', 'stationery', '2027-03-12', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Buy the rings', 'attire', '2027-04-01', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Write the vows', null, '2027-04-28', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Chase the last RSVPs', null, '2027-05-01', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Give the venue final numbers', 'venue', '2027-05-22', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Plan the order of the day', null, '2027-05-29', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Final dress fitting', 'attire', '2027-05-29', 'todo', null);
  insert into milestones (wedding_id, title, category, due_date, status, completed_at) values (w, 'Pay the venue balance', 'venue', '2027-05-12', 'todo', null);
  insert into milestones (wedding_id, title, category, status) values (w, 'Decide on favours', null, 'todo');
  insert into milestones (wedding_id, title, category, status) values (w, 'Ask Granny about her veil', 'attire', 'todo');
  insert into milestones (wedding_id, title, category, status) values (w, 'Look into a photo booth', 'music', 'todo');
  -- Appointments
  insert into appointments (wedding_id, title, on_date, at_time, location, contact_id, area_key) values (w, 'Venue visit, Ashcombe Barn', '2026-09-19', '11:00', 'Ashcombe Barn', (select sd.contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ashcombe Barn'), 'venue');
  insert into appointments (wedding_id, title, on_date, at_time, location, contact_id, area_key) values (w, 'Meeting with Sarah at the barn', '2026-10-24', '14:00', 'Ashcombe Barn', (select sd.contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ashcombe Barn'), 'venue');
  insert into appointments (wedding_id, title, on_date, at_time, location, contact_id, area_key) values (w, 'Florist consultation', '2026-10-30', '10:00', 'Wild & Gather studio', (select sd.contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Wild & Gather'), 'flowers');
  insert into appointments (wedding_id, title, on_date, at_time, location, contact_id, area_key) values (w, 'Dress fitting', '2026-11-07', '11:30', 'Ivory & Lace, Cheltenham', (select sd.contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ivory & Lace Bridal'), 'attire');
  insert into appointments (wedding_id, title, on_date, at_time, location, contact_id, area_key) values (w, 'Menu tasting', '2026-11-21', '18:30', 'Fork & Field kitchen', (select sd.contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Fork & Field'), 'food');
  insert into appointments (wedding_id, title, on_date, at_time, location, contact_id, area_key) values (w, 'Engagement shoot', '2026-12-05', '14:00', 'Leckhampton Hill', (select sd.contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Ellie Rose Photography'), 'photography');
  insert into appointments (wedding_id, title, on_date, at_time, location, contact_id, area_key) values (w, 'Cake tasting', '2027-01-16', '15:00', 'Sugar Loft', (select sd.contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Sugar Loft'), 'cake');
  insert into appointments (wedding_id, title, on_date, at_time, location, contact_id, area_key) values (w, 'Hair and make-up trial', '2027-03-20', '10:00', 'Glow by Mia', (select sd.contact_id from supplier_details sd join contacts ct on ct.id = sd.contact_id where ct.wedding_id = w and sd.company_name = 'Glow by Mia'), 'hair-makeup');
  -- The Day
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '09:00', 'Hair and make-up begins', 'Bridal suite', 'Mia + 2', 'hair-makeup');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '11:30', 'Photographer arrives for prep shots', 'Bridal suite', 'Ellie', 'photography');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '12:45', 'Olivia leaves in the Bentley', 'Home', 'Phil', 'transport');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '13:00', 'Guests arrive, welcome drinks', 'The courtyard', null, 'venue');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '13:30', 'Ceremony', 'The barn', 'Registrar', 'venue');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '14:15', 'Drinks, canapés and lawn games', 'The lawn', null, 'food');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '15:00', 'Group photos', 'By the old oak', 'Ellie, Oscar rounds people up', 'photography');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '16:00', 'Wedding breakfast', 'The barn', null, 'food');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '18:00', 'Speeches', 'The barn', 'Richard, Theo, Oscar', null);
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '19:30', 'Evening guests arrive', null, null, 'venue');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '20:00', 'First dance', 'Dance floor', 'The Velvet Notes', 'music');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '20:30', 'Cake cutting', null, null, 'cake');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '21:30', 'Pizza from the wood-fired oven', 'The courtyard', null, 'food');
  insert into run_sheet_items (wedding_id, at_time, title, location, who, area_key) values (w, '23:30', 'Carriages', 'Front drive', 'Swift Coaches', 'transport');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Top table', 10, 0, 50, 12, 'long');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'The Cotswolds', 8, 1, 20, 38, 'round');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Bath', 8, 2, 40, 38, 'round');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Bristol', 8, 3, 60, 38, 'round');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Cheltenham', 8, 4, 80, 38, 'round');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Oxford', 8, 5, 20, 70, 'round');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Burford', 8, 6, 40, 70, 'round');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Stroud', 8, 7, 60, 70, 'round');
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Painswick', 8, 8, 80, 70, 'round');

  -- Seat the coming day guests: bridal party and parents on the top table,
  -- everyone else round the others in household order; a few left to place.
  insert into seats (contact_id, wedding_id, table_id)
  select ct.id, w, (select id from seating_tables where wedding_id = w and name = 'Top table')
  from contacts ct
  where ct.wedding_id = w and ct.role_on_the_day in ('Maid of honour','Best man','Mother of the bride','Father of the bride','Mother of the groom');
  insert into seats (contact_id, wedding_id, table_id)
  select g.id, w, t.id
  from (
    select ct.id, row_number() over (order by ct.household_id, ct.created_at) - 1 as n
    from contacts ct join rsvps r on r.contact_id = ct.id and r.event_id = e_day and r.status = 'attending'
    where ct.wedding_id = w and ct.id not in (select contact_id from seats where wedding_id = w)
  ) g
  join seating_tables t on t.wedding_id = w and t.sort_order = 1 + (g.n / 7)
  where g.n < 52;

  -- Transport
  insert into transport_runs (wedding_id, at_time, vehicle, from_place, to_place, notes) values
    (w, '12:45', '1936 Bentley', 'Home', 'Ashcombe Barn', 'Olivia and Richard'),
    (w, '12:15', 'Coach (33 seats)', 'The Bell Hotel, Tetbury', 'Ashcombe Barn', 'Back at 23:30'),
    (w, '23:30', 'Coach (33 seats)', 'Ashcombe Barn', 'The Bell Hotel, Tetbury', null);
  insert into transport_passengers (run_id, contact_id, wedding_id)
  select (select id from transport_runs where wedding_id = w and at_time = '12:15'), ct.id, w
  from contacts ct join households hh on hh.id = ct.household_id
  where ct.wedding_id = w and hh.name in ('The Patels','The Harts','The Nguyens','The Fletchers','Leo Grant','The Wrights','The Lowes','Zara Ahmed','Chloe Price');
  insert into transport_passengers (run_id, contact_id, wedding_id)
  select (select id from transport_runs where wedding_id = w and at_time = '12:45'), ct.id, w
  from contacts ct where ct.wedding_id = w and ct.first_name = 'Richard' and ct.last_name = 'Bennett';

  -- Notes
  insert into notes (wedding_id, area_key, body, url, created_at) values
    (w, null, 'Ask the barn if dogs are allowed — Biscuit as ring bearer?', null, now() - interval '2 days'),
    (w, null, 'Dried flower arch, love the colours', 'https://www.pinterest.co.uk/', now() - interval '1 day'),
    (w, null, 'Auntie Jo would love to do a reading', null, now() - interval '6 days'),
    (w, 'music', 'Band to learn ''Harvest Moon'' for the first dance', null, now() - interval '9 days'),
    (w, 'food', 'Late-night cheese board instead of a second dessert?', null, now() - interval '12 days'),
    (w, null, 'Honeymoon: Puglia or the Amalfi coast?', null, now() - interval '3 hours');
end
$$;
