"use server";

import { revalidatePath } from "next/cache";
import { confirmSignInCode, sendSignInCode } from "@/lib/db/auth";

/**
 * The two steps of signing in (/sign-in). They return a message rather than
 * throw, so a page left open across a deploy can't blank the screen.
 */

function tidy(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}

function code(token: unknown): string {
  return String(token ?? "").replace(/\s/g, "");
}

async function safely(run: () => Promise<{ error?: string }>): Promise<{ error?: string }> {
  try {
    return await run();
  } catch (error) {
    console.error("email code step failed", error);
    return { error: "Something went wrong. Please try again." };
  }
}

export async function sendCodeAction(email: string) {
  const address = tidy(email);
  if (!/^\S+@\S+\.\S+$/.test(address)) return { error: "That doesn't look like an email address." };
  return safely(() => sendSignInCode(address));
}

export async function confirmCodeAction(email: string, token: string) {
  const address = tidy(email);
  const digits = code(token);
  if (!/^\d{6,10}$/.test(digits)) return { error: "The code is the number in the email." };
  const result = await safely(() => confirmSignInCode(address, digits));
  if (!result.error) revalidatePath("/", "layout");
  return result;
}
