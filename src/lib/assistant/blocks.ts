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
      };
    }
  | { kind: "set_guest_answer"; input: { guestId: string; status: "to_invite" | "pending" | "attending" | "declined" } }
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

export type Block =
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
