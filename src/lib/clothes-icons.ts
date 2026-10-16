import { createLucideIcon } from "lucide-react";

/**
 * Two icons Lucide doesn't have (owner, 16 Oct 2026: "a t-shirt doesn't feel
 * right" for Attire), drawn in its own style — a 24-unit box, round 2px
 * strokes — so they sit with the rest. Attire's default is the dress.
 */
export const Dress = createLucideIcon("dress", [
  // Thin straps, a sweetheart bodice, a nipped waist and a full skirt with
  // a fold sweeping across it.
  ["path", { d: "M9.3 2.5 9.7 6", key: "strapl" }],
  ["path", { d: "M14.7 2.5 14.3 6", key: "strapr" }],
  ["path", { d: "M9.5 6c1 0 1.8.5 2.5 1.3.7-.8 1.5-1.3 2.5-1.3l-1 4.5h-3z", key: "bodice" }],
  ["path", { d: "M10.5 10.5C8.6 14 6.2 17.6 3.5 20.4c2.6 1 5.6 1.5 8.5 1.5s5.9-.5 8.5-1.5c-2.7-2.8-5.1-6.4-7-9.9", key: "skirt" }],
  ["path", { d: "M12.3 12.5c.2 3.1-1 6.2-3.1 8.9", key: "fold" }],
]);

export const Suit = createLucideIcon("suit", [
  // Sloping shoulders, lapels meeting at the waist, a bow tie and two buttons.
  ["path", { d: "M8.5 3.5 4 6.5V21h16V6.5l-4.5-3", key: "jacket" }],
  ["path", { d: "M8.5 3.5 12 13l3.5-9.5", key: "lapels" }],
  ["path", { d: "M9.6 5.4 12 6.5l2.4-1.1v2.3L12 6.6 9.6 7.7z", key: "bow" }],
  ["path", { d: "M12 16v.01M12 18.8v.01", key: "buttons" }],
]);
