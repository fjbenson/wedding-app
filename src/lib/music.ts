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
