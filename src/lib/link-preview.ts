/**
 * The picture and title a web page offers for sharing (its og:image and
 * og:title — what shows when you paste a link into a message), for Inspo's
 * link cards. Best effort: anything that goes wrong just means no preview.
 *
 * It fetches a page someone pasted, from our server, so it's careful:
 * ordinary public web addresses only (no bare IP addresses or local names),
 * at most three redirects each re-checked, 4 seconds, and the first 600 KB.
 */
export async function linkPreview(url: string): Promise<{ image: string | null; title: string | null }> {
  const none = { image: null, title: null };
  try {
    let current = new URL(url);
    for (let hop = 0; hop < 4; hop++) {
      if (!allowed(current)) return none;
      const res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(4000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; WeddingAppPreview/1.0)", accept: "text/html" },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        current = new URL(res.headers.get("location")!, current);
        continue;
      }
      if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return none;
      const html = await firstBytes(res, 600_000);
      const image = meta(html, ["og:image", "og:image:url", "twitter:image"]);
      const title = meta(html, ["og:title", "twitter:title"]) ?? html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1] ?? null;
      const imageUrl = image ? new URL(decode(image), current) : null;
      return {
        image: imageUrl && imageUrl.protocol === "https:" ? imageUrl.toString() : null,
        title: title ? decode(title).trim().slice(0, 200) || null : null,
      };
    }
  } catch {
    // Timed out, blocked, not HTML — no preview, the link still saves.
  }
  return none;
}

function allowed(url: URL): boolean {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".local") || host.endsWith(".internal") || host === "localhost") return false;
  // A bare IP address (v4, or v6 in brackets) could point anywhere, including inside a network.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.startsWith("[")) return false;
  return true;
}

async function firstBytes(res: Response, limit: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < limit) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    size += value.length;
  }
  reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function meta(html: string, names: string[]): string | null {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name.replace(/:/g, ":")}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`,
      "i",
    );
    const m = html.match(re);
    if (m) return m[1] ?? m[2];
  }
  return null;
}

function decode(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
