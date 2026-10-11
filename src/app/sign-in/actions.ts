"use server";

import { revalidatePath } from "next/cache";
import { confirmSaveCode, confirmSignInCode, sendSaveCode, sendSignInCode } from "@/lib/db/auth";

/**
 * The code steps, for "Save your wedding" (Settings) and signing in on
 * another phone (/sign-in). They return a message rather than throw, so a
 * page left open across a deploy can't blank the screen.
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

export async function sendCodeAction(mode: "save" | "sign-in", email: string) {
  const address = tidy(email);
  if (!/^\S+@\S+\.\S+$/.test(address)) return { error: "That doesn't look like an email address." };
  return safely(() => (mode === "save" ? sendSaveCode(address) : sendSignInCode(address)));
}

export async function confirmCodeAction(mode: "save" | "sign-in", email: string, token: string) {
  const address = tidy(email);
  const digits = code(token);
  if (!/^\d{6,10}$/.test(digits)) return { error: "The code is the number in the email." };
  const result = await safely(() => (mode === "save" ? confirmSaveCode(address, digits) : confirmSignInCode(address, digits)));
  if (!result.error) revalidatePath("/", "layout");
  return result;
}
