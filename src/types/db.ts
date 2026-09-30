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
