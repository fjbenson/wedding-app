import ViewTabs from "@/components/view-tabs";

/**
 * Guests | Suppliers at the top of People. The bridal party is a filter on
 * the guest list (owner's call, 8 Oct 2026), not a tab of its own.
 */
export default function PeopleTabs({
  current,
  guestCount,
  supplierCount,
}: {
  current: "guests" | "suppliers";
  guestCount: number;
  supplierCount: number;
}) {
  return (
    <ViewTabs
      label="People"
      tabs={[
        { label: "Guests", href: "/people", active: current === "guests", count: guestCount },
        { label: "Suppliers", href: "/people?tab=suppliers", active: current === "suppliers", count: supplierCount },
      ]}
    />
  );
}
