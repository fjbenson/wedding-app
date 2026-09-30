/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql.
 *
 * Once a Supabase project exists, replace these with generated types:
 *   npm run db:types
 */

export type MemberRole = "owner" | "planner" | "guest";
export type ContactType = "guest" | "supplier" | "bridal_party" | "venue";
export type SupplierStatus = "researching" | "enquired" | "booked" | "cancelled";
export type RsvpStatus = "pending" | "attending" | "declined";
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
  /** Free-text key facts shown on the area's page (0005_area_details.sql). */
  details?: string | null;
  /** This area's share of the budget, if set (0006_money.sql). */
  budget?: number | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  wedding_id: string;
  title: string;
  description: string | null;
  category: string | null;
  due_date: string | null;
  remind_at: string | null;
  status: MilestoneStatus;
  assigned_to: string | null;
  completed_at: string | null;
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
  created_at: string;
}

export interface SeatingTable {
  id: string;
  wedding_id: string;
  name: string;
  capacity: number;
  sort_order: number;
  created_at: string;
}

/** Which table a guest sits at. A guest sits at one table at most. */
export interface Seat {
  contact_id: string;
  wedding_id: string;
  table_id: string;
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
