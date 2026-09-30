import ViewTabs from "@/components/view-tabs";

/**
 * Guests | Suppliers at the top of People (docs/information-architecture.md:
 * guests, bridal party and suppliers are tabs of one page). The bridal
 * party is a filtered view of the guests, not a list of its own.
 */
export default function PeopleTabs({
  current,
  guestCount,
  partyCount,
  supplierCount,
}: {
  current: "guests" | "party" | "suppliers";
  guestCount: number;
  partyCount: number;
  supplierCount: number;
}) {
  return (
    <ViewTabs
      label="People"
      tabs={[
        { label: "Guests", href: "/people", active: current === "guests", count: guestCount },
        { label: "Bridal party", href: "/people?tab=party", active: current === "party", count: partyCount },
        { label: "Suppliers", href: "/people?tab=suppliers", active: current === "suppliers", count: supplierCount },
      ]}
    />
  );
}
