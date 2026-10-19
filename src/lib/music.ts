/**
 * A song's link, named by where it plays (owner, 19 Oct 2026: the raw link
 * was "quite ugly"): "Spotify", "YouTube", "Apple Music", else the site.
 */
export function musicSource(url: string): string {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "the link";
  }
  if (host.endsWith("spotify.com")) return "Spotify";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "YouTube";
  if (host.endsWith("music.apple.com")) return "Apple Music";
  if (host.endsWith("soundcloud.com")) return "SoundCloud";
  if (host.endsWith("tidal.com")) return "Tidal";
  if (host.endsWith("deezer.com")) return "Deezer";
  return host || "the link";
}

/** Who or what plays a moment's music (owner, 19 Oct 2026: "the main thing with music is the technology"). */
export const PLAYED_BY: { value: "band" | "dj" | "venue" | "device"; label: string }[] = [
  { value: "band", label: "Band" },
  { value: "dj", label: "DJ" },
  { value: "venue", label: "Venue speakers" },
  { value: "device", label: "Our phone or laptop" },
];

export const playedByLabel = (v: string | null | undefined) => PLAYED_BY.find((p) => p.value === v)?.label ?? null;

/** "Playlist: Welcome drinks" or just the song. */
export const musicTitle = (m: { music?: string | null; music_kind?: string | null }) =>
  m.music ? (m.music_kind === "playlist" ? `Playlist: ${m.music}` : m.music) : null;

/** The ready-made list for the Music area (owner, 19 Oct 2026: is there a backup if the sound fails?). */
export const SOUND_CHECK = {
  name: "Sound check",
  lines: [
    "Playlists downloaded to play offline",
    "A backup phone, charged",
    "Aux cable or Bluetooth speaker as backup",
    "Test it at the venue",
    "A mic for the speeches",
    "The venue's sound contact's number",
  ],
};
