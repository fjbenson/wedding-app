import AppShell from "@/components/app-shell";
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

  return <AppShell wedding={wedding}>{children}</AppShell>;
}
