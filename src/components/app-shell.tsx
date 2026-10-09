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
      {/*
        Behind the phone's clock and battery. Added to the home screen, the
        app runs full screen under a see-through status bar, so the page
        scrolled up into the time. This frosted strip is exactly the status
        bar's height — nothing at all in a normal browser tab or on a laptop.
      */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[env(safe-area-inset-top)] bg-ivory/80 backdrop-blur-md print:hidden"
      />
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
