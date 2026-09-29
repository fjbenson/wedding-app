/** Pulls something readable out of whatever Supabase threw. */
export function describe(error: unknown): string {
  if (error && typeof error === "object") {
    const { message, code, hint } = error as Record<string, unknown>;
    return [code, message, hint].filter(Boolean).join(" — ");
  }
  return String(error);
}
