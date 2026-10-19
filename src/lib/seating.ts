/**
 * Which chair each guest at a table sits in (0025_seat_number.sql). A guest
 * with a chair number keeps it; anyone without one (seated before chairs
 * were saved, or from the map's "tap a name, then a table") fills the free
 * chairs in the order given. Shared by the floor plan's dots and the table
 * close-up, so both draw the same person in the same place.
 *
 * Returns one entry per chair (index 0 = chair 1), the guest's id or null.
 */
export function arrangeSeats(
  guestIds: string[],
  seatOf: Map<string, number | null>,
  chairs: number,
): (string | null)[] {
  const slots: (string | null)[] = Array.from({ length: Math.max(chairs, guestIds.length) }, () => null);
  const loose: string[] = [];
  for (const id of guestIds) {
    const n = seatOf.get(id);
    if (n && n <= slots.length && slots[n - 1] === null) slots[n - 1] = id;
    else loose.push(id);
  }
  for (const id of loose) {
    const free = slots.indexOf(null);
    if (free === -1) slots.push(id);
    else slots[free] = id;
  }
  return slots;
}
