/**
 * Shown the moment a screen is tapped, while its data is on the way, so the
 * tap feels answered straight away. The frame (menu bar, sidebar) stays put
 * around it. Pale bars in the rough shape of a heading and a list.
 */
export default function Loading() {
  return (
    <div className="page animate-pulse pb-28" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-20 rounded-full bg-linen" />
      <div className="mt-5 h-8 w-2/3 rounded-full bg-linen" />
      <div className="mt-3 h-3 w-1/3 rounded-full bg-linen/70" />
      <div className="mt-10 space-y-5">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="h-4 rounded-full bg-linen/70" style={{ width: `${85 - row * 9}%` }} />
        ))}
      </div>
    </div>
  );
}
