import MenuBar from "@/components/menu-bar";
import Sidebar from "@/components/sidebar";

/**
 * The frame around the main screens. Phones get the floating menu bar at the
 * bottom; desktops (1024px and up) get a sidebar on the left instead.
 */
export default function AppShell({
  current,
  wedding,
  children,
}: {
  current: string;
  wedding: { name: string; wedding_date: string | null };
  children: React.ReactNode;
}) {
  return (
    <div className="lg:flex">
      <Sidebar current={current} name={wedding.name} weddingDate={wedding.wedding_date} />
      <div className="min-w-0 flex-1">{children}</div>
      <MenuBar current={current} />
    </div>
  );
}
