import { Suspense } from "react";
import CaptureButton from "@/components/capture-button";
import CapturedToast from "@/components/captured-toast";
import MenuBar from "@/components/menu-bar";
import SideBar from "@/components/side-bar";

/**
 * The frame around every screen once there's a wedding. Phones get the
 * floating menu bar at the bottom; laptops (1024px and up) get the menu down
 * the left (`SideBar`, 20 Oct 2026) and the page beside it. It stays put while moving between screens — only the
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
      <SideBar name={wedding.name} inboxCount={inboxCount} />
      <div className="min-w-0 lg:pl-[250px] print:!pl-0">{children}</div>
      <MenuBar />
      <CaptureButton />
      <Suspense fallback={null}>
        <CapturedToast />
      </Suspense>
    </div>
  );
}
