import CornerSwitch from "@/components/corner-switch";

/**
 * The top of People: Guests | Suppliers as a small rounded switch on the
 * right (owner's pick, canvas "Guest list · Round 13", 9 Oct 2026).
 */
export default function PeopleTabs({ current }: { current: "guests" | "suppliers" }) {
  return (
    <CornerSwitch
      label="People"
      tabs={[
        { label: "Guests", href: "/people", active: current === "guests" },
        { label: "Suppliers", href: "/people?tab=suppliers", active: current === "suppliers" },
      ]}
    />
  );
}
