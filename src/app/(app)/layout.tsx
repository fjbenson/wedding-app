import AppShell from "@/components/app-shell";
import { listNotes } from "@/lib/db/notes";
import { getCurrentWedding } from "@/lib/db/weddings";

/**
 * Wraps every screen in the sidebar / menu bar frame. Because it's a layout,
 * it isn't redrawn when moving between screens — only the page inside is.
 * Before there's a wedding (the "start with the day itself" screen) there's
 * nothing to navigate to, so no frame.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const wedding = await getCurrentWedding();
  if (!wedding) return children;

  // Unfiled captures, for the count beside Inbox in the sidebar.
  const unfiled = await listNotes(wedding.id, { area: null });

  return (
    <AppShell wedding={wedding} inboxCount={unfiled?.length ?? 0}>
      {children}
    </AppShell>
  );
}
