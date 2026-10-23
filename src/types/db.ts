/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql.
 *
 * Once a Supabase project exists, replace these with generated types:
 *   npm run db:types
 */

export type MemberRole = "owner" | "planner" | "guest";
export type ContactType = "guest" | "supplier" | "bridal_party" | "venue";
/** "researching" is from before 0012_area_stages.sql, which moves those rows to "enquired". */
export type SupplierStatus = "researching" | "enquired" | "quoted" | "booked" | "cancelled";
/** To invite → Invited ("pending") → Coming / Can't come. "to_invite" needs 0013_to_invite.sql. */
export type RsvpStatus = "to_invite" | "pending" | "attending" | "declined";
export type MilestoneStatus = "todo" | "in_progress" | "done" | "skipped";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Wedding {
  id: string;
  name: string;
  wedding_date: string | null;
  venue_contact_id: string | null;
  created_by: string;
  created_at: string;
  /** The whole budget, if set (0006_money.sql). */
  budget?: number | null;
}

export interface WeddingMember {
  id: string;
  wedding_id: string;
  user_id: string;
  role: MemberRole;
  contact_id: string | null;
  created_at: string;
}

export interface Household {
  id: string;
  wedding_id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  created_at: string;
}

/**
 * A group of guests (0019_guest_groups.sql): people who belong together —
 * "The football lot", "Staying at the pub". Unlike a household, a guest can
 * be in any number, and a group has no address.
 */
export interface GuestGroup {
  id: string;
  wedding_id: string;
  name: string;
  created_at: string;
}

export interface GuestGroupMember {
  group_id: string;
  contact_id: string;
  wedding_id: string;
  created_at: string;
}

export interface Contact {
  id: string;
  wedding_id: string;
  household_id: string | null;
  contact_type: ContactType;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_child: boolean;
  /** Bridesmaid, best man, usher… (0004_guest_roles.sql). Null for a plain guest. */
  role_on_the_day: string | null;
  /** Staying over? 'yes' / 'no', null = not asked yet (0020_travel.sql; missing until it's run). */
  staying?: "yes" | "no" | null;
  /** Where they're staying (only with 'yes'); null = not sure where. */
  stay_id?: string | null;
  /** Making their own way, so they don't count as having no lift. */
  own_way?: boolean;
  /** Adult, child's or no meal; and soft drinks only (0033_children_meals.sql). Both change what the caterer charges. */
  meal_kind?: "adult" | "child" | "none";
  no_alcohol?: boolean;
  created_at: string;
}

/** A place guests stay — a hotel, the pub, a rented cottage (0020_travel.sql). */
export interface Stay {
  id: string;
  wedding_id: string;
  name: string;
  /** Anything to remember: the address, a booking code. */
  note: string | null;
  sort_order: number;
  created_at: string;
}

export interface SupplierDetails {
  contact_id: string;
  company_name: string | null;
  category: string | null;
  status: SupplierStatus;
  quoted_cost: number | null;
  deposit_paid: number | null;
  contract_url: string | null;
  /** Their website (0015_supplier_website.sql); missing until that's run. */
  website?: string | null;
  created_at: string;
}

export interface WeddingEvent {
  id: string;
  wedding_id: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  created_at: string;
}

export interface Invitation {
  id: string;
  wedding_id: string;
  household_id: string;
  token: string;
  sent_at: string | null;
  created_at: string;
}

export interface Rsvp {
  id: string;
  wedding_id: string;
  invitation_id: string | null;
  contact_id: string;
  event_id: string;
  status: RsvpStatus;
  meal_choice: string | null;
  dietary_notes: string | null;
  responded_at: string | null;
  created_at: string;
}

/** An area of the wedding — a dot on the hub (0003_areas.sql). */
export interface AreaRow {
  id: string;
  wedding_id: string;
  key: string;
  label: string;
  enabled: boolean;
  show_on_hub: boolean;
  sort_order: number;
  /** The old key facts (0005_area_details.sql); moved into notes on 21 Oct 2026 and no longer shown. */
  details?: string | null;
  /** This area's share of the budget, if set (0006_money.sql). */
  budget?: number | null;
  /** The icon's name from src/lib/area-icons.ts (0016_area_icon.sql). */
  icon?: string | null;
  /** "We're doing this ourselves": skips Quotes and Booked (0012_area_stages.sql). */
  diy?: boolean;
  /** The couple has marked the area ready, its last stage (0012_area_stages.sql). */
  ready?: boolean;
  /** The caterer's price a head, for Food & drink (0033_children_meals.sql). */
  price_adult?: number | null;
  price_child?: number | null;
  price_drinks?: number | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  category: string | null;
  due_date: string | null;
  /** "14:30:00", or null for any time that day (0037_todo_time.sql). */
  due_time?: string | null;
  remind_at: string | null;
  status: MilestoneStatus;
  assigned_to: string | null;
  completed_at: string | null;
  /** The call or meeting it came from (0032_timeline.sql). */
  timeline_entry_id?: string | null;
  created_at: string;
}

/** Money owed or paid (0006_money.sql). Unpaid while `paid_on` is null. */
export interface Payment {
  id: string;
  wedding_id: string;
  contact_id: string | null;
  area_key: string | null;
  description: string;
  amount: number;
  due_date: string | null;
  paid_on: string | null;
  notes: string | null;
  created_at: string;
}

/** Money coming in towards the wedding: "Mum and Dad, £5,000" (0022_contributions.sql). */
export interface Contribution {
  id: string;
  wedding_id: string;
  /** Who's giving, as the couple call them ("Mum and Dad", "Us"). */
  name: string;
  /** The guest it's from, when picked from the guest list. */
  contact_id: string | null;
  amount: number;
  /** What it's towards: an area's key, or null for the wedding as a whole. */
  area_key: string | null;
  /** When it arrived; null means promised. */
  received_on: string | null;
  notes: string | null;
  created_at: string;
}

/** A fitting, a tasting, a venue visit (0007_appointments.sql). */
export interface Appointment {
  id: string;
  wedding_id: string;
  title: string;
  on_date: string;
  /** "14:30:00", or null for a whole-day thing. Local time, no time zone. */
  at_time: string | null;
  location: string | null;
  contact_id: string | null;
  area_key: string | null;
  notes: string | null;
  created_at: string;
}

/** A quick capture — a thought or a link (0008_notes.sql). Unfiled while `area_key` is null. */
export interface Note {
  id: string;
  wedding_id: string;
  area_key: string | null;
  body: string | null;
  url: string | null;
  /** The to-do it was made into (0014_note_todo.sql); missing until that's run. */
  milestone_id?: string | null;
  created_at: string;
}

/** One line of the run sheet — the order of the day (0009_the_day.sql). */
export interface RunSheetItem {
  id: string;
  wedding_id: string;
  at_time: string;
  title: string;
  location: string | null;
  who: string | null;
  notes: string | null;
  /** The area it belongs to, by key; empty is Other (0017_run_sheet_area.sql). */
  area_key?: string | null;
  /** A song or playlist for the moment, and its link (0028_moment_music.sql). */
  music?: string | null;
  music_url?: string | null;
  /** How it's played (0030_moment_music_how.sql). */
  music_kind?: "song" | "playlist" | null;
  music_played?: "band" | "dj" | "venue" | "device" | null;
  music_who?: string | null;
  /** Who's in charge: a supplier or guest from the list (0031_moment_in_charge.sql); `who` is a typed name. */
  contact_id?: string | null;
  /** Which run sheet it is on; none is the main one, "The day" (0035_run_sheets.sql). */
  sheet_id?: string | null;
  created_at: string;
}

/** A run sheet besides the main one: the bridesmaids', the groomsmen's (0035_run_sheets.sql). */
export interface RunSheet {
  id: string;
  wedding_id: string;
  name: string;
  /** The group of guests it is for, so it can be emailed to them. */
  group_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface SeatingTable {
  id: string;
  wedding_id: string;
  name: string;
  capacity: number;
  sort_order: number;
  created_at: string;
  /** Centre on the floor plan, as % of the room (0011_floor_plan.sql). Null until first dragged; missing before 0011 is run. */
  pos_x?: number | null;
  pos_y?: number | null;
  shape?: TableShape;
}

export type TableShape = "round" | "long" | "top";

/** Which table a guest sits at. A guest sits at one table at most. */
export interface Seat {
  contact_id: string;
  wedding_id: string;
  table_id: string;
  /** Which chair, from 1 (0025_seat_number.sql); null: any free one. Missing until 0025 is run. */
  seat_no?: number | null;
}

/** One run of a car or coach on the day. */
export interface TransportRun {
  id: string;
  wedding_id: string;
  at_time: string;
  vehicle: string;
  from_place: string | null;
  to_place: string | null;
  notes: string | null;
  created_at: string;
}

export interface TransportPassenger {
  run_id: string;
  contact_id: string;
  wedding_id: string;
}

/** A saved idea — an uploaded picture and/or a pasted link (0010_inspo.sql). Unsorted while `area_key` is null. */
export interface InspoItem {
  id: string;
  wedding_id: string;
  area_key: string | null;
  image_path: string | null;
  image_url: string | null;
  url: string | null;
  title: string | null;
  note: string | null;
  created_at: string;
}

export type FileKind = "contract" | "quote" | "invoice" | "receipt" | "other";

/** A contract, quote, invoice or receipt kept in the app (0018_files.sql). */
export interface WeddingFile {
  id: string;
  wedding_id: string;
  contact_id: string | null;
  area_key: string | null;
  kind: FileKind;
  signed: boolean;
  name: string;
  path: string;
  size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
}

/** A course of the menu — canapés, the wedding breakfast, evening food (0024_menu_and_drinks.sql). */
export interface MenuCourse {
  id: string;
  wedding_id: string;
  name: string;
  /** "HH:MM:SS" or null. */
  serve_time: string | null;
  note: string | null;
  /** Evening guests are fed this one too. */
  evening: boolean;
  sort_order: number;
  /** The run sheet moment it's served at (0034_food_moments_and_schedules.sql). */
  moment_id?: string | null;
  created_at: string;
}

/** One dish on a course. `tags` are "V", "VG", "GF". */
export interface MenuDish {
  id: string;
  course_id: string;
  wedding_id: string;
  name: string;
  tags: string[];
  /** "Vegetarians: mushroom wellington". */
  instead: string | null;
  /** On the children's menu (0034). */
  for_children?: boolean;
  sort_order: number;
  created_at: string;
}

export type DrinkKind = "fizz" | "wine" | "beer" | "spirits" | "soft" | "hot" | "other";
export type DrinkStatus = "undecided" | "to_order" | "ordered" | "delivered";

/** A plain tick-list — the toilet baskets, the bridesmaids' room (0029_lists.sql). */
export interface WeddingList {
  id: string;
  wedding_id: string;
  name: string;
  /** Shows on that area's page too; null for none. */
  area_key: string | null;
  sort_order: number;
  created_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  wedding_id: string;
  text: string;
  done: boolean;
  sort_order: number;
  created_at: string;
}

export type DecorStatus = "to_get" | "got" | "packed" | "returned";
export type DecorSource = "own" | "borrowed" | "hired" | "bought" | "made";

/** One decor thing — jam jars, the easel, the guest book pen (0027_decor.sql). */
export interface DecorItem {
  id: string;
  wedding_id: string;
  /** Where it goes on the day: "Ceremony", "The tables"… */
  place: string | null;
  name: string;
  quantity: number | null;
  status: DecorStatus;
  source: DecorSource | null;
  /** Who it's from: a guest or supplier on the list, or just a name. */
  from_contact_id: string | null;
  from_name: string | null;
  collect_on: string | null;
  return_on: string | null;
  /** Helpers not on the list; those who are sit in decor_helpers. */
  setup_names: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

/** A drink through the day, with how much and who's supplying it (0024). */
export interface Drink {
  id: string;
  wedding_id: string;
  name: string;
  moment: string | null;
  kind: DrinkKind;
  serve_time: string | null;
  quantity: number | null;
  unit: string | null;
  supplied_by: string | null;
  status: DrinkStatus;
  /** The run sheet moment it's served at (0034_food_moments_and_schedules.sql). */
  moment_id?: string | null;
  sort_order: number;
  created_at: string;
}

export type TimelineKind =
  | "call" | "meeting" | "email" | "message" | "note"
  | "save_the_date" | "invitation" | "thank_you" | "stage";

/** What was said or sent, with a supplier, guest, household, group or area (0032_timeline.sql). */
export interface TimelineEntry {
  id: string;
  wedding_id: string;
  kind: TimelineKind;
  happened_on: string;
  summary: string | null;
  how: "email" | "post" | "hand" | "text" | null;
  contact_id: string | null;
  household_id: string | null;
  group_id: string | null;
  area_key: string | null;
  created_at: string;
}
