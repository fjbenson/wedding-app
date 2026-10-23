import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import PlanCards from "./plan/plan-cards";
import UndoToast from "@/components/undo-toast";
import ViewMemory from "@/components/view-memory";
import { listNotes } from "@/lib/db/notes";
import { toSort } from "@/lib/notes";
import { getCurrentWedding, listWeddings } from "@/lib/db/weddings";
import { getLogin } from "@/lib/db/auth";

/**
 * Wraps every screen in the sidebar / menu bar frame. Because it's a layout,
 * it isn't redrawn when moving between screens — only the page inside is.
 * Before there's a wedding (the "start with the day itself" screen) there's
 * nothing to navigate to, so no frame.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const wedding = await getCurrentWedding();
  if (!wedding) return children;

  // Unfiled captures, for the count beside Your notes in the sidebar; who's
  // signed in and how many weddings they have, for its foot.
  const [unfiled, login, weddings] = await Promise.all([
    listNotes(wedding.id, { area: null }),
    getLogin(),
    listWeddings(),
  ]);

  return (
    <AppShell
      wedding={wedding}
      inboxCount={unfiled?.filter(toSort).length ?? 0}
      email={login?.email ?? null}
      manyWeddings={weddings.length > 1}
    >
      {children}
      <UndoToast />
      <ViewMemory />
      {/* A to-do or appointment tapped anywhere opens here, over the page (?todo= / ?appointment=). */}
      <Suspense>
        <PlanCards />
      </Suspense>
    </AppShell>
  );
}
