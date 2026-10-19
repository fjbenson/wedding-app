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
  w uuid; e_day uuid; e_eve uuid; c uuid;
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

  -- Households (name, address, city, postcode, country, invitation sent)
  insert into households (wedding_id, name, address_line1, city, postcode, country)
  select w, v.hn, v.ha, v.hc, v.hp, v.hco from (values
    ('The Bennetts', '14 Orchard Lane', 'Cheltenham', 'GL52 3AB', 'United Kingdom', true),
    ('The Hales', '3 Mill Close', 'Bath', 'BA2 4QT', 'United Kingdom', true),
    ('Grace Whitfield', 'Flat 2, 41 Park Street', 'Bristol', 'BS1 5NG', 'United Kingdom', true),
    ('Oscar Hale', '22 Kingsdown Parade', 'Bristol', 'BS6 5UE', 'United Kingdom', true),
    ('Priya & Tom', '8 Rosemary Gardens', 'London', 'SE15 4RT', 'United Kingdom', true),
    ('Hannah Cole', '17 Victoria Road', 'Oxford', 'OX2 7QD', 'United Kingdom', true),
    ('The Moores', '5 Church View', 'Stroud', 'GL5 1HD', 'United Kingdom', true),
    ('Jack & Ellie', '29 Hampton Road', 'Bristol', 'BS6 6HP', 'United Kingdom', true),
    ('Sam Okafor', '11 Cotham Hill', 'Bristol', 'BS6 6LA', 'United Kingdom', true),
    ('Granny Bennett', 'The Willows, Sheep Street', 'Burford', 'OX18 4LS', 'United Kingdom', true),
    ('The Patels', '62 Elm Grove', 'Reading', 'RG1 5HN', 'United Kingdom', true),
    ('The Harts', '4 Station Approach', 'Cirencester', 'GL7 1AE', 'United Kingdom', true),
    ('Uncle Pete & Aunt Jo', '19 Ferry Lane', 'Tewkesbury', 'GL20 5BA', 'United Kingdom', true),
    ('The Carters', '7 Beech Avenue', 'Swindon', 'SN1 4EF', 'United Kingdom', true),
    ('Chloe Price', '33 Queens Road', 'Cardiff', 'CF10 3NP', 'United Kingdom', true),
    ('The Nguyens', '12 Marlborough Hill', 'Bristol', 'BS2 8EZ', 'United Kingdom', true),
    ('Dan Okafor', '50 Gloucester Road', 'Bristol', 'BS7 8NN', 'United Kingdom', true),
    ('The Fletchers', '2 Abbey Mews', 'Malmesbury', 'SN16 9AS', 'United Kingdom', true),
    ('Laura & Mike', '45 Wells Road', 'Bath', 'BA2 3AP', 'United Kingdom', true),
    ('Zara Ahmed', '9 Clifton Vale', 'Bristol', 'BS8 4PT', 'United Kingdom', true),
    ('The Wrights', '88 High Street', 'Marlborough', 'SN8 1HF', 'United Kingdom', true),
    ('Kate Lawson', '15 Kings Road', 'Brighton', 'BN1 2FN', 'United Kingdom', true),
    ('The Hughes', '6 Meadow Way', 'Monmouth', 'NP25 3EP', 'United Kingdom', true),
    ('Ella Moss', '21 Albion Street', 'Cheltenham', 'GL52 2LP', 'United Kingdom', true),
    ('The Ashworths', '3 Quarry Road', 'Frome', 'BA11 1QD', 'United Kingdom', true),
    ('Tilly & Jess', '10 Raleigh Road', 'Bristol', 'BS3 1QR', 'United Kingdom', true),
    ('The O''Briens', '27 Harbour View', 'Cork', 'T12 X2N4', 'Ireland', true),
    ('Leo Grant', '14 Charlotte Street', 'London', 'W1T 2LX', 'United Kingdom', true),
    ('The Stantons', '1 Vicarage Lane', 'Painswick', 'GL6 6XP', 'United Kingdom', true),
    ('Maya Robinson', '52 St Michael''s Hill', 'Bristol', 'BS2 8DX', 'United Kingdom', true),
    ('The Kellys', '18 Riverside', 'Gloucester', 'GL1 2QR', 'United Kingdom', false),
    ('Ruby Evans', '4 Bridge Street', 'Chepstow', 'NP16 5EZ', 'United Kingdom', true),
    ('The Lowes', '31 Grove Park', 'Bath', 'BA1 3RD', 'United Kingdom', true),
    ('Callum Reid', '7 Leith Walk', 'Edinburgh', 'EH6 8LP', 'United Kingdom', true),
    ('Work friends · Olivia', null, null, null, null, true),
    ('Work friends · Theo', null, null, null, null, true),
    ('The Greens', '40 Stokes Croft', 'Bristol', 'BS1 3QD', 'United Kingdom', true),
    ('Neighbours', '16 Orchard Lane', 'Cheltenham', 'GL52 3AB', 'United Kingdom', true),
    ('Rob Hayes', '22 Ashley Road', 'Bristol', 'BS6 5NL', 'United Kingdom', false),
    ('Ollie Stone', '9 Cotham Brow', 'Bristol', 'BS6 6AW', 'United Kingdom', false),
    ('Dev Mistry', '41 North Street', 'Bristol', 'BS3 1EN', 'United Kingdom', false),
    ('Evie Clarke', '3 Southville Road', 'Bristol', 'BS3 1DG', 'United Kingdom', true),
    ('Yoga friends', null, null, null, null, true)
  ) v(hn, ha, hc, hp, hco, sent);
  insert into invitations (wedding_id, household_id, sent_at)
  select w, hh.id, case when v.sent then timestamptz '2026-09-20' end from households hh join (values
    ('The Bennetts', true),
    ('The Hales', true),
    ('Grace Whitfield', true),
    ('Oscar Hale', true),
    ('Priya & Tom', true),
    ('Hannah Cole', true),
    ('The Moores', true),
    ('Jack & Ellie', true),
    ('Sam Okafor', true),
    ('Granny Bennett', true),
    ('The Patels', true),
    ('The Harts', true),
    ('Uncle Pete & Aunt Jo', true),
    ('The Carters', true),
    ('Chloe Price', true),
    ('The Nguyens', true),
    ('Dan Okafor', true),
    ('The Fletchers', true),
    ('Laura & Mike', true),
    ('Zara Ahmed', true),
    ('The Wrights', true),
    ('Kate Lawson', true),
    ('The Hughes', true),
    ('Ella Moss', true),
    ('The Ashworths', true),
    ('Tilly & Jess', true),
    ('The O''Briens', true),
    ('Leo Grant', true),
    ('The Stantons', true),
    ('Maya Robinson', true),
    ('The Kellys', false),
    ('Ruby Evans', true),
    ('The Lowes', true),
    ('Callum Reid', true),
    ('Work friends · Olivia', true),
    ('Work friends · Theo', true),
    ('The Greens', true),
    ('Neighbours', true),
    ('Rob Hayes', false),
    ('Ollie Stone', false),
    ('Dev Mistry', false),
    ('Evie Clarke', true),
    ('Yoga friends', true)
  ) v(hn, sent) on v.hn = hh.name where hh.wedding_id = w;
  -- Guests (household, first, last, child, day/evening, answer, meal, diet, role, email, phone, answered)
  create temp table demo_guests (hh text, first text, last text, child boolean, kind text, answer rsvp_status, meal text, diet text, role text, email text, phone text, answered timestamptz, id uuid default gen_random_uuid()) on commit drop;
  insert into demo_guests (hh, first, last, child, kind, answer, meal, diet, role, email, phone, answered) values
    ('The Bennetts', 'Claire', 'Bennett', false, 'day', 'attending', 'Beef wellington', null, 'Mother of the bride', 'claire.bennett@example.com', '07700 900107', '2026-10-09'),
    ('The Bennetts', 'Richard', 'Bennett', false, 'day', 'attending', null, null, 'Father of the bride', 'richard.bennett@example.com', null, '2026-10-04'),
    ('The Hales', 'Fiona', 'Hale', false, 'day', 'attending', 'Beef wellington', 'Gluten-free', 'Mother of the groom', 'fiona.hale@example.com', null, '2026-10-09'),
    ('The Hales', 'Martin', 'Hale', false, 'day', 'attending', 'Beef wellington', null, null, 'martin.hale@example.com', '07700 900114', '2026-10-01'),
    ('Grace Whitfield', 'Grace', 'Whitfield', false, 'day', 'attending', null, 'Vegetarian', 'Maid of honour', 'grace.whitfield@example.com', '07700 900121', '2026-10-01'),
    ('Oscar Hale', 'Oscar', 'Hale', false, 'day', 'attending', 'Wild mushroom risotto', null, 'Best man', null, '07700 900128', '2026-10-02'),
    ('Priya & Tom', 'Priya', 'Shah', false, 'day', 'attending', 'Beef wellington', 'Vegetarian', 'Bridesmaid', 'priya.shah@example.com', '07700 900135', '2026-10-04'),
    ('Priya & Tom', 'Tom', 'Ellis', false, 'day', 'attending', 'Beef wellington', null, null, 'tom.ellis@example.com', '07700 900142', '2026-10-04'),
    ('Hannah Cole', 'Hannah', 'Cole', false, 'day', 'attending', 'Sea bass', 'Dairy-free', 'Bridesmaid', 'hannah.cole@example.com', '07700 900149', '2026-10-08'),
    ('The Moores', 'Sophie', 'Moore', false, 'day', 'attending', 'Beef wellington', null, 'Bridesmaid', 'sophie.moore@example.com', '07700 900156', '2026-10-02'),
    ('The Moores', 'Ben', 'Moore', false, 'day', 'attending', null, null, null, 'ben.moore@example.com', '07700 900163', '2026-10-08'),
    ('The Moores', 'Isla', 'Moore', true, 'day', 'attending', 'Children''s menu', null, 'Flower girl', null, null, '2026-10-05'),
    ('The Moores', 'Alfie', 'Moore', true, 'day', 'attending', 'Children''s menu', 'Nut allergy', 'Page boy', null, null, '2026-10-02'),
    ('Jack & Ellie', 'Jack', 'Turner', false, 'day', 'attending', 'Beef wellington', null, 'Groomsman', 'jack.turner@example.com', null, '2026-10-08'),
    ('Jack & Ellie', 'Ellie', 'Turner', false, 'day', 'attending', 'Wild mushroom risotto', 'Vegan', null, 'ellie.turner@example.com', '07700 900170', '2026-10-06'),
    ('Sam Okafor', 'Sam', 'Okafor', false, 'day', 'attending', 'Sea bass', null, 'Groomsman', 'sam.okafor@example.com', '07700 900177', '2026-10-02'),
    ('Granny Bennett', 'Margaret', 'Bennett', false, 'day', 'attending', 'Sea bass', 'Soft food', null, 'margaret.bennett@example.com', '07700 900184', '2026-10-08'),
    ('The Patels', 'Anil', 'Patel', false, 'day', 'attending', 'Sea bass', 'Vegetarian', null, null, '07700 900191', '2026-10-08'),
    ('The Patels', 'Meera', 'Patel', false, 'day', 'attending', 'Beef wellington', 'Vegetarian', null, 'meera.patel@example.com', '07700 900198', '2026-10-08'),
    ('The Patels', 'Riya', 'Patel', true, 'day', 'attending', 'Children''s menu', null, null, null, null, '2026-10-06'),
    ('The Harts', 'Amelia', 'Hart', false, 'day', 'attending', 'Sea bass', null, null, null, null, '2026-10-03'),
    ('The Harts', 'Daniel', 'Hart', false, 'day', 'attending', null, null, null, 'daniel.hart@example.com', '07700 900205', '2026-10-08'),
    ('Uncle Pete & Aunt Jo', 'Peter', 'Hale', false, 'day', 'attending', 'Beef wellington', null, null, 'peter.hale@example.com', null, '2026-10-07'),
    ('Uncle Pete & Aunt Jo', 'Jo', 'Hale', false, 'day', 'attending', 'Sea bass', 'Gluten-free', null, 'jo.hale@example.com', '07700 900212', '2026-10-07'),
    ('The Carters', 'Ben', 'Carter', false, 'day', 'pending', null, null, null, 'ben.carter@example.com', '07700 900219', null),
    ('The Carters', 'Lucy', 'Carter', false, 'day', 'pending', null, null, null, 'lucy.carter@example.com', null, null),
    ('Chloe Price', 'Chloe', 'Price', false, 'day', 'attending', 'Sea bass', null, null, 'chloe.price@example.com', null, '2026-10-05'),
    ('The Nguyens', 'Linh', 'Nguyen', false, 'day', 'attending', 'Wild mushroom risotto', 'Shellfish allergy', null, 'linh.nguyen@example.com', null, '2026-10-06'),
    ('The Nguyens', 'David', 'Nguyen', false, 'day', 'attending', 'Wild mushroom risotto', null, null, 'david.nguyen@example.com', '07700 900226', '2026-10-01'),
    ('Dan Okafor', 'Dan', 'Okafor', false, 'day', 'declined', null, null, null, 'dan.okafor@example.com', '07700 900233', '2026-10-09'),
    ('The Fletchers', 'Rose', 'Fletcher', false, 'day', 'attending', 'Wild mushroom risotto', null, null, 'rose.fletcher@example.com', '07700 900240', '2026-10-07'),
    ('The Fletchers', 'James', 'Fletcher', false, 'day', 'attending', 'Beef wellington', null, null, null, null, '2026-10-02'),
    ('The Fletchers', 'Poppy', 'Fletcher', true, 'day', 'attending', 'Children''s menu', null, null, null, null, '2026-10-06'),
    ('Laura & Mike', 'Laura', 'Grant', false, 'day', 'pending', null, null, null, null, '07700 900247', null),
    ('Laura & Mike', 'Mike', 'Grant', false, 'day', 'pending', null, null, null, 'mike.grant@example.com', '07700 900254', null),
    ('Zara Ahmed', 'Zara', 'Ahmed', false, 'day', 'attending', 'Beef wellington', 'No pork', null, 'zara.ahmed@example.com', '07700 900261', '2026-10-07'),
    ('The Wrights', 'Helen', 'Wright', false, 'day', 'attending', 'Sea bass', null, null, 'helen.wright@example.com', null, '2026-10-08'),
    ('The Wrights', 'Graham', 'Wright', false, 'day', 'attending', null, null, null, 'graham.wright@example.com', null, '2026-10-08'),
    ('Kate Lawson', 'Kate', 'Lawson', false, 'day', 'declined', null, null, null, 'kate.lawson@example.com', '07700 900268', '2026-10-03'),
    ('The Hughes', 'Rhys', 'Hughes', false, 'day', 'pending', null, null, null, 'rhys.hughes@example.com', null, null),
    ('The Hughes', 'Bethan', 'Hughes', false, 'day', 'pending', null, null, null, 'bethan.hughes@example.com', '07700 900275', null),
    ('The Hughes', 'Osian', 'Hughes', true, 'day', 'pending', null, null, null, null, null, null),
    ('Ella Moss', 'Ella', 'Moss', false, 'day', 'attending', null, null, null, null, null, '2026-10-09'),
    ('Ella Moss', 'Finn', 'Doyle', false, 'day', 'attending', null, null, null, 'finn.doyle@example.com', '07700 900282', '2026-10-09'),
    ('The Ashworths', 'Nina', 'Ashworth', false, 'day', 'attending', 'Sea bass', 'Pescatarian', null, 'nina.ashworth@example.com', '07700 900289', '2026-10-09'),
    ('The Ashworths', 'Paul', 'Ashworth', false, 'day', 'attending', 'Wild mushroom risotto', null, null, 'paul.ashworth@example.com', '07700 900296', '2026-10-09'),
    ('Tilly & Jess', 'Tilly', 'Brooks', false, 'day', 'pending', null, null, null, 'tilly.brooks@example.com', '07700 900303', null),
    ('Tilly & Jess', 'Jess', 'Marsh', false, 'day', 'pending', null, null, null, 'jess.marsh@example.com', null, null),
    ('The O''Briens', 'Aoife', 'O''Brien', false, 'day', 'pending', null, null, null, 'aoife.obrien@example.com', '07700 900310', null),
    ('The O''Briens', 'Conor', 'O''Brien', false, 'day', 'pending', null, null, null, 'conor.obrien@example.com', '07700 900317', null),
    ('Leo Grant', 'Leo', 'Grant', false, 'day', 'attending', 'Sea bass', null, null, 'leo.grant@example.com', '07700 900324', '2026-10-01'),
    ('The Stantons', 'Hugh', 'Stanton', false, 'day', 'declined', null, null, null, 'hugh.stanton@example.com', '07700 900331', '2026-10-08'),
    ('The Stantons', 'Pam', 'Stanton', false, 'day', 'declined', null, null, null, 'pam.stanton@example.com', '07700 900338', '2026-10-06'),
    ('Maya Robinson', 'Maya', 'Robinson', false, 'day', 'attending', null, 'Vegan', null, 'maya.robinson@example.com', '07700 900345', '2026-10-06'),
    ('The Kellys', 'Sean', 'Kelly', false, 'day', 'to_invite', null, null, null, null, null, null),
    ('The Kellys', 'Niamh', 'Kelly', false, 'day', 'to_invite', null, null, null, 'niamh.kelly@example.com', '07700 900352', null),
    ('Ruby Evans', 'Ruby', 'Evans', false, 'day', 'attending', 'Beef wellington', null, null, 'ruby.evans@example.com', '07700 900359', '2026-10-08'),
    ('The Lowes', 'Simon', 'Lowe', false, 'day', 'attending', 'Wild mushroom risotto', null, null, 'simon.lowe@example.com', '07700 900366', '2026-10-02'),
    ('The Lowes', 'Anna', 'Lowe', false, 'day', 'attending', 'Sea bass', 'Gluten-free', null, 'anna.lowe@example.com', '07700 900373', '2026-10-03'),
    ('Callum Reid', 'Callum', 'Reid', false, 'day', 'pending', null, null, null, 'callum.reid@example.com', '07700 900380', null),
    ('Work friends · Olivia', 'Harriet', 'Shaw', false, 'evening', 'attending', null, null, null, 'harriet.shaw@example.com', null, '2026-10-07'),
    ('Work friends · Olivia', 'Josh', 'Bell', false, 'evening', 'attending', null, null, null, 'josh.bell@example.com', '07700 900387', '2026-10-02'),
    ('Work friends · Olivia', 'Amira', 'Haddad', false, 'evening', 'attending', null, 'Vegetarian', null, 'amira.haddad@example.com', '07700 900394', '2026-10-03'),
    ('Work friends · Olivia', 'Will', 'Parsons', false, 'evening', 'attending', null, null, null, 'will.parsons@example.com', null, '2026-10-08'),
    ('Work friends · Theo', 'Kieran', 'Doyle', false, 'evening', 'pending', null, null, null, null, '07700 900401', null),
    ('Work friends · Theo', 'Freya', 'Lund', false, 'evening', 'pending', null, null, null, 'freya.lund@example.com', '07700 900408', null),
    ('Work friends · Theo', 'Marcus', 'Webb', false, 'evening', 'pending', null, null, null, 'marcus.webb@example.com', '07700 900415', null),
    ('The Greens', 'Tess', 'Green', false, 'evening', 'attending', null, null, null, null, '07700 900422', '2026-10-01'),
    ('The Greens', 'Alex', 'Green', false, 'evening', 'attending', null, null, null, 'alex.green@example.com', '07700 900429', '2026-10-02'),
    ('Neighbours', 'Jean', 'Porter', false, 'evening', 'attending', null, null, null, 'jean.porter@example.com', '07700 900436', '2026-10-07'),
    ('Neighbours', 'Colin', 'Porter', false, 'evening', 'attending', null, null, null, 'colin.porter@example.com', '07700 900443', '2026-10-04'),
    ('Rob Hayes', 'Rob', 'Hayes', false, 'evening', 'to_invite', null, null, null, 'rob.hayes@example.com', null, null),
    ('Ollie Stone', 'Ollie', 'Stone', false, 'evening', 'to_invite', null, null, null, 'ollie.stone@example.com', '07700 900450', null),
    ('Dev Mistry', 'Dev', 'Mistry', false, 'evening', 'to_invite', null, null, null, 'dev.mistry@example.com', '07700 900457', null),
    ('Evie Clarke', 'Evie', 'Clarke', false, 'evening', 'declined', null, null, null, null, '07700 900464', '2026-10-06'),
    ('Yoga friends', 'Lena', 'Fischer', false, 'evening', 'attending', null, 'Vegan', null, 'lena.fischer@example.com', '07700 900471', '2026-10-09'),
    ('Yoga friends', 'Sasha', 'Ivanova', false, 'evening', 'attending', null, null, null, 'sasha.ivanova@example.com', '07700 900478', '2026-10-09'),
    (null, 'Arthur', 'Bennett', false, 'day', 'attending', 'Beef wellington', null, null, 'arthur.bennett@example.com', null, '2026-10-09'),
    (null, 'Nora', 'Quinn', false, 'evening', 'pending', null, null, null, 'nora.quinn@example.com', null, null);
  insert into contacts (id, wedding_id, household_id, contact_type, first_name, last_name, email, phone, is_child, role_on_the_day)
  select g.id, w, hh.id, case when g.role is null then 'guest' else 'bridal_party' end::contact_type, g.first, g.last, g.email, g.phone, g.child, g.role
  from demo_guests g left join households hh on hh.wedding_id = w and hh.name = g.hh;
  -- Day guests are on both events (meal on the day's), evening guests on the evening only.
  insert into rsvps (wedding_id, invitation_id, contact_id, event_id, status, meal_choice, dietary_notes, responded_at)
  select w, i.id, g.id, ev.id, g.answer,
         case when ev.id = e_day and g.answer = 'attending' then g.meal end,
         case when ev.id = e_day or g.kind = 'evening' then g.diet end,
         g.answered
  from demo_guests g
  left join households hh on hh.wedding_id = w and hh.name = g.hh
  left join invitations i on i.household_id = hh.id
  join events ev on ev.wedding_id = w and (ev.id = e_eve or g.kind = 'day');

  -- Groups of guests (0019_guest_groups.sql): people who belong together, any number per guest.
  if to_regclass('public.guest_groups') is not null then
    insert into guest_groups (wedding_id, name) values (w, 'The football lot') returning id into c;
    insert into guest_group_members (group_id, contact_id, wedding_id)
      select c, g.id, w from demo_guests g where (g.first, g.last) in (('Rob','Hayes'),('Ollie','Stone'),('Dev','Mistry'));
    insert into guest_groups (wedding_id, name) values (w, 'Staying at the pub') returning id into c;
    insert into guest_group_members (group_id, contact_id, wedding_id)
      select c, g.id, w from demo_guests g where (g.first, g.last) in
        (('Callum','Reid'),('Leo','Grant'),('Kate','Lawson'),('Ruby','Evans'),('Aoife','O''Brien'),('Conor','O''Brien'),('Ella','Moss'),('Finn','Doyle'));
  end if;

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
  insert into seating_tables (wedding_id, name, capacity, sort_order, pos_x, pos_y, shape) values (w, 'Top table', 10, 0, 50, 12, 'top');
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

  -- Music on the run sheet (0028_moment_music.sql).
  update run_sheet_items r set music = v.music, music_url = v.url
  from (values
    ('Guests arrive, welcome drinks', 'Welcome drinks playlist', 'https://open.spotify.com/search/wedding%20welcome%20drinks'),
    ('Ceremony', 'Walking down the aisle: A Thousand Years, Christina Perri', 'https://open.spotify.com/search/A%20Thousand%20Years%20Christina%20Perri'),
    ('Wedding breakfast', 'The entrance: Mr Brightside, The Killers', 'https://open.spotify.com/search/Mr%20Brightside%20The%20Killers'),
    ('First dance', 'Harvest Moon, Neil Young', 'https://open.spotify.com/search/Harvest%20Moon%20Neil%20Young'),
    ('Cake cutting', 'Sugar, Sugar, The Archies', 'https://open.spotify.com/search/Sugar%20Sugar%20The%20Archies'),
    ('Carriages', 'Last song: Don''t Stop Me Now, Queen', 'https://open.spotify.com/search/Don%27t%20Stop%20Me%20Now%20Queen')
  ) as v(title, music, url)
  where r.wedding_id = w and r.title = v.title;
  update run_sheet_items r set music_kind = v.kind, music_played = v.played, music_who = v.who
  from (values
    ('Guests arrive, welcome drinks', 'playlist', 'venue', 'Sam Okafor'),
    ('Ceremony', 'song', 'device', 'Jack Turner'),
    ('Wedding breakfast', 'song', 'venue', 'Sam Okafor'),
    ('First dance', 'song', 'band', null),
    ('Cake cutting', 'song', 'band', null),
    ('Carriages', 'song', 'dj', null)
  ) as v(title, kind, played, who)
  where r.wedding_id = w and r.title = v.title;
  update run_sheet_items set music = 'Welcome drinks' where wedding_id = w and title = 'Guests arrive, welcome drinks';
  -- Who's in charge of each moment, from the list (0031_moment_in_charge.sql).
  update run_sheet_items r set contact_id = sd.contact_id, who = null
  from (values
    ('Hair and make-up begins', 'Glow by Mia'),
    ('Photographer arrives for prep shots', 'Ellie Rose Photography'),
    ('Olivia leaves in the Bentley', 'Cotswold Classic Cars'),
    ('Group photos', 'Ellie Rose Photography'),
    ('Wedding breakfast', 'Fork & Field'),
    ('First dance', 'The Velvet Notes'),
    ('Cake cutting', 'Sugar Loft'),
    ('Pizza from the wood-fired oven', 'Fork & Field'),
    ('Carriages', 'Swift Coaches')
  ) as v(title, company)
  join supplier_details sd on sd.company_name = v.company
  join contacts c on c.id = sd.contact_id and c.wedding_id = w
  where r.wedding_id = w and r.title = v.title;
  update run_sheet_items r set contact_id = c.id, who = null
  from contacts c
  where r.wedding_id = w and r.title = 'Guests arrive, welcome drinks' and c.wedding_id = w and c.first_name = 'Sam' and c.last_name = 'Okafor';

  -- Decor (0027_decor.sql): its own area, and the things for the day.
  insert into areas (wedding_id, key, label, enabled, show_on_hub, sort_order, budget, details, icon) values (w, 'decor', 'Decor', true, true, 10, 800, '- Wild, warm, lots of candlelight
- Borrow before buying', 'Palette');
  insert into decor_items (wedding_id, place, name, quantity, status, source, from_contact_id, from_name, collect_on, return_on, setup_names, notes, sort_order)
  select w, v.place, v.name, v.qty, v.status, v.source,
         (select id from contacts where wedding_id = w and first_name = v.fn and last_name = v.ln limit 1),
         v.from_name, v.collect_on::date, v.return_on::date, v.setup_names, v.notes, v.n
  from (values
    (1,  'Ceremony', 'Aisle runner', 1, 'to_get', 'hired', null, null, 'Glow Hire', null, '2027-06-14', null, null),
    (2,  'Ceremony', 'Chair-end flowers', 16, 'got', 'made', null, null, null, null, null, null, null),
    (3,  'Ceremony', 'Confetti cones', 80, 'packed', 'bought', null, null, 'Etsy', null, null, null, null),
    (4,  'Ceremony', 'Ring box', 1, 'packed', 'own', null, null, null, null, null, null, null),
    (5,  'Arrival and entrance', 'Easel for the table plan', 1, 'to_get', 'borrowed', 'Sarah', 'Lyle', null, '2027-06-06', '2027-06-15', null, 'Ask the barn for the clips too'),
    (6,  'Arrival and entrance', 'Welcome sign', 1, 'to_get', 'bought', null, null, 'Etsy', '2027-06-03', null, null, null),
    (7,  'Arrival and entrance', 'Guest book and pen', 1, 'packed', 'own', null, null, null, null, null, null, null),
    (8,  'Arrival and entrance', 'Card box', 1, 'got', 'borrowed', null, null, 'Emma (married last May)', '2027-05-30', '2027-06-14', null, null),
    (9,  'Arrival and entrance', 'Umbrella basket', 1, 'got', 'own', null, null, null, null, null, null, null),
    (10, 'The tables', 'Jam jars', 40, 'got', 'borrowed', 'Claire', 'Bennett', null, '2027-06-10', '2027-06-15', null, null),
    (11, 'The tables', 'Tea lights', 120, 'got', 'bought', null, null, 'Ikea', null, null, null, null),
    (12, 'The tables', 'Table numbers', 10, 'to_get', 'made', null, null, null, null, null, null, 'Pressed flowers in frames'),
    (13, 'The tables', 'Place cards', 79, 'to_get', 'made', null, null, null, null, null, 'Olivia', null),
    (14, 'The tables', 'Favours', 79, 'to_get', 'made', null, null, null, null, null, null, 'Seed packets'),
    (15, 'The room', 'Strings of fairy lights', 3, 'to_get', 'hired', null, null, 'Glow Hire', '2027-06-11', '2027-06-14', 'Glow Hire', null),
    (16, 'Outside', 'Lawn games', 1, 'got', 'borrowed', 'Richard', 'Bennett', null, '2027-06-11', '2027-06-14', null, 'Giant Jenga and quoits'),
    (17, 'Bar and cake', 'Cake knife and server', 1, 'packed', 'own', null, null, null, null, null, null, null),
    (18, 'Bar and cake', 'Cake stand', 1, 'got', 'borrowed', 'Jo', 'Barnes', null, null, '2027-06-14', null, null),
    (19, 'Toilets', 'Toilet baskets', 2, 'to_get', 'made', null, null, null, null, null, null, null),
    (20, 'Kit box', 'Emergency kit', 1, 'to_get', 'own', null, null, null, null, null, null, 'Safety pins, plasters, a lighter, tape, scissors')
  ) as v(n, place, name, qty, status, source, fn, ln, from_name, collect_on, return_on, setup_names, notes);
  insert into decor_helpers (decor_id, contact_id, wedding_id)
  select d.id, c.id, w
  from (values
    ('Aisle runner', 'Jack', 'Turner'), ('Aisle runner', 'Sam', 'Okafor'),
    ('Chair-end flowers', 'Grace', 'Whitfield'),
    ('Confetti cones', 'Isla', 'Moore'),
    ('Ring box', 'Oscar', 'Hale'),
    ('Easel for the table plan', 'Sam', 'Okafor'),
    ('Guest book and pen', 'Priya', 'Shah'),
    ('Jam jars', 'Hannah', 'Cole'), ('Jam jars', 'Sophie', 'Moore'),
    ('Tea lights', 'Hannah', 'Cole'),
    ('Lawn games', 'Jack', 'Turner')
  ) as h(item, fn, ln)
  join decor_items d on d.wedding_id = w and d.name = h.item
  join contacts c on c.wedding_id = w and c.first_name = h.fn and c.last_name = h.ln;

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

-- Timeline (0032): calls, meetings and stages with a few demo suppliers and a household.
with w as (select id from weddings where name = 'Olivia & Theo'),
s as (
  select c.id, sd.company_name, sd.category from contacts c join supplier_details sd on sd.contact_id = c.id
  where c.wedding_id = (select id from w)
)
insert into timeline_entries (wedding_id, kind, happened_on, summary, contact_id, area_key)
select (select id from w), v.kind, v.on_date::date, v.summary, s.id, s.category
from (values
  ('Wild & Gather', 'email',   '2026-09-12', 'First enquiry: June, about 80 guests, peonies if possible'),
  ('Wild & Gather', 'stage',   '2026-09-22', 'Quote in · £1,800'),
  ('Wild & Gather', 'meeting', '2026-09-30', 'Studio visit. Loved the arch, less keen on pampas.'),
  ('Wild & Gather', 'call',    '2026-10-14', 'Ellie says peonies are fine in June. Wants the colour swatches.'),
  ('Petal & Stem',  'call',    '2026-10-02', 'Can do the arch but not the buttonholes on the day.'),
  ('Ashcombe Barn', 'meeting', '2026-03-08', 'First viewing with both mums. The barn lights at dusk!'),
  ('Ashcombe Barn', 'stage',   '2026-03-20', 'Booked'),
  ('Ashcombe Barn', 'call',    '2026-09-18', 'Confirmed last orders at 11.30 and the 12.30 carriages.'),
  ('Paper & Post Co.', 'email', '2026-02-02', 'Asked for samples of the deckle-edge card'),
  ('Paper & Post Co.', 'stage', '2026-02-20', 'Booked')
) as v(company, kind, on_date, summary)
join s on s.company_name = v.company;

-- A to-do that came out of the florist call.
insert into milestones (wedding_id, title, category, due_date, status, timeline_entry_id)
select t.wedding_id, 'Send Ellie the colour swatches', 'flowers', '2026-10-23', 'todo', t.id
from timeline_entries t
where t.wedding_id = (select id from weddings where name = 'Olivia & Theo') and t.kind = 'call' and t.summary like 'Ellie says peonies%';

-- Groups with their own schedules, and food and drink served at the day's
-- moments (0033, 0034): the bridesmaids' and groomsmen's mornings, and the
-- courses and drinks linked to the moments they're served at.
do $$
declare
  w constant uuid := (select id from weddings where name = 'Olivia & Theo');
  bm uuid; gm uuid;
  m_canape uuid; m_pizza uuid; m_speech uuid; m_evening uuid;
begin
  insert into guest_groups (wedding_id, name) values (w, 'Bridesmaids') returning id into bm;
  insert into guest_groups (wedding_id, name) values (w, 'Groomsmen') returning id into gm;
  insert into guest_group_members (group_id, contact_id, wedding_id)
    select bm, id, w from contacts where wedding_id = w and role_on_the_day in ('Maid of honour', 'Bridesmaid');
  insert into guest_group_members (group_id, contact_id, wedding_id)
    select gm, id, w from contacts where wedding_id = w and role_on_the_day in ('Best man', 'Groomsman');

  insert into run_sheet_items (wedding_id, at_time, title, location, area_key) values
    (w, '08:00', 'Breakfast at Mum''s, everyone in their robes', 'The Bennetts'' kitchen', 'hair-makeup'),
    (w, '10:15', 'Make-up: Priya, Hannah and Sophie', 'The Bennetts'' kitchen', 'hair-makeup'),
    (w, '11:00', 'Dresses on', 'Olivia''s room', 'attire'),
    (w, '09:30', 'Breakfast at the pub', 'The Coach and Horses', 'food'),
    (w, '11:00', 'Suits on, buttonholes pinned', 'The Coach and Horses', 'attire');
  insert into run_sheet_groups (moment_id, group_id, wedding_id)
    select id, bm, w from run_sheet_items
    where wedding_id = w and title in ('Hair and make-up begins', 'Photographer arrives for prep shots', 'Group photos',
      'Breakfast at Mum''s, everyone in their robes', 'Make-up: Priya, Hannah and Sophie', 'Dresses on');
  insert into run_sheet_groups (moment_id, group_id, wedding_id)
    select id, gm, w from run_sheet_items
    where wedding_id = w and title in ('Breakfast at the pub', 'Suits on, buttonholes pinned', 'Guests arrive, welcome drinks', 'Group photos');

  select id into m_canape from run_sheet_items where wedding_id = w and title = 'Drinks, canapés and lawn games';
  select id into m_pizza from run_sheet_items where wedding_id = w and title = 'Pizza from the wood-fired oven';
  select id into m_speech from run_sheet_items where wedding_id = w and title = 'Speeches';
  select id into m_evening from run_sheet_items where wedding_id = w and title = 'Evening guests arrive';
  update menu_courses set moment_id = m_canape where wedding_id = w and name = 'Canapés';
  update menu_courses set moment_id = m_pizza where wedding_id = w and name = 'Evening';
  update menu_courses set moment_id = (select id from run_sheet_items where wedding_id = w and title = 'Wedding breakfast') where wedding_id = w and name = 'Wedding breakfast';
  update drinks set moment_id = m_canape where wedding_id = w and name in ('Arrival fizz', 'Pimm''s jugs');
  update drinks set moment_id = (select id from run_sheet_items where wedding_id = w and title = 'Wedding breakfast') where wedding_id = w and name in ('Red wine', 'White wine');
  update drinks set moment_id = m_speech where wedding_id = w and name = 'Champagne for the toast';
  update drinks set moment_id = m_evening where wedding_id = w and name in ('Local cask ale', 'Gin, spirits, soft drinks');
end $$;
