import { Suspense } from "react";
import CaptureButton from "@/components/capture-button";
import CapturedToast from "@/components/captured-toast";
import MenuBar from "@/components/menu-bar";
import Sidebar from "@/components/sidebar";

/**
 * The frame around every screen once there's a wedding. Phones get the
 * floating menu bar at the bottom; desktops (1024px and up) get a sidebar on
 * the left instead. It stays put while moving between screens — only the
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
    <div className="lg:flex">
      <Sidebar name={wedding.name} weddingDate={wedding.wedding_date} inboxCount={inboxCount} />
      <div className="min-w-0 flex-1">{children}</div>
      <MenuBar />
      <CaptureButton />
      <Suspense fallback={null}>
        <CapturedToast />
      </Suspense>
    </div>
  );
}
