import ViewTabs from "@/components/view-tabs";

/**
 * Guests | Suppliers at the top of People (docs/information-architecture.md:
 * guests, bridal party and suppliers are tabs of one page). Bridal party
 * joins as a filtered view of guests later.
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
