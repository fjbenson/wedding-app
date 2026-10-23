import { Suspense } from "react";
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
  email,
  manyWeddings,
  children,
}: {
  wedding: { name: string; wedding_date: string | null };
  inboxCount: number;
  email: string | null;
  manyWeddings: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <SideBar name={wedding.name} inboxCount={inboxCount} email={email} manyWeddings={manyWeddings} />
      <div className="page-frame min-w-0 lg:pl-[280px] print:!pl-0">{children}</div>
      <MenuBar />
      <Suspense fallback={null}>
        <CapturedToast />
      </Suspense>
    </div>
  );
}
