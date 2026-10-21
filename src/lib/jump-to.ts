/**
 * Scrolls to a part of a card and gives it a soft champagne glow, so the eye
 * lands on it — what a tap on a card's summary does (owner, 19 Oct 2026: tap
 * Table at the top of a guest's card, it goes to where the table is changed).
 */
export function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // A fold that's closed (the guest card's Food & drink…) opens first, then it scrolls.
  let folded = false;
  for (let d = el.closest("details"); d; d = d.parentElement?.closest("details") ?? null) {
    if (!d.open) {
      d.open = true;
      folded = true;
    }
  }
  if (folded) {
    requestAnimationFrame(() => jumpTo(id));
    return;
  }
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
  el.animate?.([{ backgroundColor: "rgb(241 231 212 / 0.9)" }, { backgroundColor: "rgb(241 231 212 / 0)" }], {
    duration: 1600,
    delay: still ? 0 : 300,
    easing: "ease-out",
  });
}
