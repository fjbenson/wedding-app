"use server";

import { searchWedding, type SearchResult } from "@/lib/db/search";
import { getCurrentWedding } from "@/lib/db/weddings";

/** Search the whole wedding as you type in Your assistant's box (no AI; nothing leaves the app). */
export async function searchAction(query: string): Promise<{ results: SearchResult[]; error?: string }> {
  const wedding = await getCurrentWedding();
  if (!wedding) return { results: [] };
  try {
    return { results: await searchWedding(wedding.id, query) };
  } catch (error) {
    console.error("search failed", error);
    return { results: [], error: "Search didn't work just then." };
  }
}
