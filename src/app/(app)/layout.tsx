import { Suspense } from "react";
import AppShell from "@/components/app-shell";
import PlanCards from "./plan/plan-cards";
import UndoToast from "@/components/undo-toast";
import ViewMemory from "@/components/view-memory";
import { listNotes } from "@/lib/db/notes";
import { toSort } from "@/lib/notes";
import { getCurrentWedding } from "@/lib/db/weddings";

/**
 * Wraps every screen in the top bar / menu bar frame. Because it's a layout,
 * it isn't redrawn when moving between screens — only the page inside is.
 * Before there's a wedding (the "start with the day itself" screen) there's
 * nothing to navigate to, so no frame.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const wedding = await getCurrentWedding();
  if (!wedding) return children;

  // Unfiled captures, for the count beside Notes in the top bar.
  const unfiled = await listNotes(wedding.id, { area: null });

  return (
    <AppShell wedding={wedding} inboxCount={unfiled?.filter(toSort).length ?? 0}>
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
