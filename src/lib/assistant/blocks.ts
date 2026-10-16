/**
 * What Your assistant sends to the panel, besides its words: answer blocks
 * drawn by the app from a lookup's own data (never retyped by the AI), and
 * confirm cards for a change that waits on the couple's Yes.
 *
 * A plain file (no "use client"), so the route and the panel both import it.
 */
import type { GuestLine, MoneySummary, SupplierLine, TableLine, WeekItem } from "@/lib/lookups";

/** A change the assistant has proposed; nothing is saved until Yes. */
export type Proposal =
  | {
      kind: "add_guest";
      input: {
        fullName: string;
        householdId?: string | null;
        newHousehold?: string | null;
        eventId?: string | null;
        roles?: string[];
        email?: string | null;
        phone?: string | null;
        isChild?: boolean;
        meal?: string | null;
        diet?: string | null;
        notes?: string | null;
        /** Groups to put them in, and a place they're staying (both checked against the wedding when saved). */
        groupIds?: string[];
        stayId?: string | null;
        /** Their answer on the event they're a guest of; to invite unless said otherwise. */
        answer?: "to_invite" | "pending" | "attending" | "declined";
      };
    }
  | { kind: "set_guest_answer"; input: { guestId: string; status: "to_invite" | "pending" | "attending" | "declined" } }
  | {
      kind: "add_appointment";
      input: {
        title: string;
        onDate: string;
        atTime?: string | null;
        location?: string | null;
        supplierId?: string | null;
        area?: string | null;
        notes?: string | null;
      };
    }
  | { kind: "move_guest"; input: { guestId: string; householdId?: string | null; newHousehold?: string | null } }
  | { kind: "set_guest_of"; input: { guestId: string; eventId: string } }
  | { kind: "set_guest_diet"; input: { guestId: string; diet: string | null } }
  | { kind: "add_guest_to_group"; input: { guestId: string; groupId: string } }
  | { kind: "set_todo_date"; input: { todoId: string; dueDate: string | null } }
  | { kind: "tick_todo"; input: { todoId: string } }
  | { kind: "mark_payment_paid"; input: { paymentId: string; paidOn?: string | null } }
  | { kind: "add_todo"; input: { title: string; dueDate?: string | null; area?: string | null; notes?: string | null } }
  | {
      kind: "add_payment";
      input: {
        description: string;
        amount: number;
        supplierId?: string | null;
        area?: string | null;
        dueDate?: string | null;
        paid?: boolean;
        paidOn?: string | null;
        notes?: string | null;
      };
    };

/** What the steps for a new guest start from, and the choices they offer. Built by the server; the answers never go back to the AI. */
export interface GuestStepsBlock {
  type: "guest_steps";
  /** Ties the steps to the tool call, so a second tap can't save it twice. */
  id: string;
  prefill: {
    fullName: string;
    eventId: string | null;
    householdId: string | null;
    newHousehold: string | null;
    diet: string[];
    /** The couple said what the diet is, or that there isn't one. */
    dietKnown: boolean;
    /** The couple said they aren't in a household. */
    noHousehold: boolean;
    answer: "to_invite" | "pending" | "attending" | "declined";
    phone: string | null;
    email: string | null;
    roles: string[];
    isChild: boolean;
    meal: string | null;
    notes: string | null;
  };
  options: {
    /** Day and evening, in date order. */
    events: { id: string; word: string }[];
    households: { id: string; name: string }[];
    groups: { id: string; name: string }[];
    stays: { id: string; name: string }[];
  };
}

/** The same idea for a to-do: what's known, and the areas to choose from. */
export interface TodoStepsBlock {
  type: "todo_steps";
  id: string;
  prefill: {
    title: string;
    dueDate: string | null;
    /** The couple said when, or that it has no date. */
    dateKnown: boolean;
    area: string | null;
    /** The couple said which area, or that it's none in particular. */
    areaKnown: boolean;
    notes: string | null;
  };
  options: { areas: { key: string; label: string }[]; today: string; weddingDate: string | null };
}

/** A payment: what it's for is known; the amount, when and who may not be. */
export interface PaymentStepsBlock {
  type: "payment_steps";
  id: string;
  prefill: {
    description: string;
    amount: number | null;
    /** The couple said whether it's paid, or gave a date. */
    whenKnown: boolean;
    paid: boolean;
    dueDate: string | null;
    paidOn: string | null;
    supplierId: string | null;
    area: string | null;
    /** The couple said who it's to, or that it's not for a supplier. */
    whoKnown: boolean;
    notes: string | null;
  };
  options: {
    suppliers: { id: string; name: string; area: string | null }[];
    areas: { key: string; label: string }[];
    today: string;
    weddingDate: string | null;
  };
}

/** An appointment: the title is known; the date, time, place and who may not be. */
export interface AppointmentStepsBlock {
  type: "appointment_steps";
  id: string;
  prefill: {
    title: string;
    date: string | null;
    time: string | null;
    /** The couple said it has no set time. */
    noTime: boolean;
    location: string | null;
    supplierId: string | null;
    area: string | null;
    notes: string | null;
  };
  options: {
    suppliers: { id: string; name: string; area: string | null }[];
    areas: { key: string; label: string }[];
    today: string;
    weddingDate: string | null;
  };
}

export type Block =
  | { type: "lookup"; title: string; total: number; counts?: { value: string; count: number }[]; sum?: { label: string; total: string }; rows: { primary: string; secondary: string }[]; link: string }
  | GuestStepsBlock
  | TodoStepsBlock
  | PaymentStepsBlock
  | AppointmentStepsBlock
  | { type: "guests"; title: string; count: number; guests: GuestLine[]; link: string }
  | { type: "money"; summary: MoneySummary }
  | { type: "week"; from: string; to: string; items: WeekItem[]; link: string }
  | { type: "seating"; tables: TableLine[]; unseated: number; link: string }
  | { type: "suppliers"; title: string; count: number; suppliers: SupplierLine[]; budget: number | null; link: string }
  | { type: "note"; body: string | null; url: string | null }
  | {
      type: "confirm";
      /** Ties the card to its tool call, so a second tap can't save it twice. */
      id: string;
      /** "Amy Latham" — the card's title. */
      title: string;
      /** "Add to the guest list" — under the title. */
      action: string;
      /** The details, as label and value. */
      rows: [string, string][];
      /** "Add her", "Add it", "Record it", "Save it". */
      yes: string;
      proposal: Proposal;
    };

/** One line of the stream from the route to the panel (newline-delimited JSON). */
export type StreamEvent =
  | { t: "text"; text: string }
  | { t: "block"; block: Block }
  | { t: "done"; messages: unknown[] }
  | { t: "error"; message: string };
