"use client";

import { MapPin } from "lucide-react";
import { BARE, CARD, Line } from "@/components/visual-form";

/**
 * Where the post goes, on New household. A browser-side piece so the icon
 * can be handed to `Line` (the page itself runs on the server, and an icon
 * can't be passed across — it crashed the page, 20 Oct 2026).
 */
export default function AddressCard() {
  return (
    <div className={CARD}>
      <Line icon={MapPin} label="Address" top>
        <span className="flex w-full flex-col divide-y divide-linen">
          <input name="address_line1" autoComplete="off" placeholder="House and street" aria-label="House and street" className={BARE} />
          <input name="address_line2" autoComplete="off" placeholder="Second line (optional)" aria-label="Second line" className={BARE} />
          <input name="city" autoComplete="off" placeholder="Town" aria-label="Town" className={BARE} />
          <input name="postcode" autoComplete="off" placeholder="Postcode" aria-label="Postcode" className={`${BARE} uppercase`} />
        </span>
      </Line>
    </div>
  );
}
