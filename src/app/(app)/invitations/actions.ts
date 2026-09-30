"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setInvitationsSent } from "@/lib/db/rsvps";
import { describe } from "@/lib/errors";

/** Marks one or more invitations as posted (or not, to undo a mis-tap). */
export async function markSentAction(invitationIds: string[], sent: boolean) {
  let detail = "";
  try {
    await setInvitationsSent(invitationIds, sent);
  } catch (error) {
    console.error("marking invitations failed", error);
    detail = describe(error);
  }
  if (detail) {
    redirect(`/invitations?error=${encodeURIComponent("That didn't save.")}&detail=${encodeURIComponent(detail)}`);
  }
  revalidatePath("/invitations");
}
