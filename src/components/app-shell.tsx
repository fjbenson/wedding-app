import { Suspense } from "react";
import CaptureButton from "@/components/capture-button";
import CapturedToast from "@/components/captured-toast";
import MenuBar from "@/components/menu-bar";
import PaneMode from "@/components/pane-mode";
import TopBar from "@/components/top-bar";

/**
 * The frame around every screen once there's a wedding. Phones get the
 * floating menu bar at the bottom; laptops (1024px and up) get a bar along
 * the top instead. It stays put while moving between screens — only the
 * middle changes.
 */
export default function AppShell({
  wedding,
  inboxCount,
  children,
}: {
  wedding: { name: string; wedding_date: string | null };
  inboxCount: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <TopBar name={wedding.name} inboxCount={inboxCount} />
      <PaneMode />
      <div className="min-w-0">{children}</div>
      <MenuBar />
      <CaptureButton />
      <Suspense fallback={null}>
        <CapturedToast />
      </Suspense>
    </div>
  );
}
