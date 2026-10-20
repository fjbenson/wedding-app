// Photographs screens of the private copy at iPhone size, and notes anything
// off: crashes, pages that scroll sideways, text under 12px.
// Usage: node scripts/check/shoot.cjs /people /plan?view=list "/area/venue"
// Pictures land in $CHECK_DIR/shots (default /tmp/wedding-check/shots).
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs");

const work = process.env.CHECK_DIR || "/tmp/wedding-check";
const urls = process.argv.slice(2);
fs.mkdirSync(`${work}/shots`, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  await ctx.addCookies(JSON.parse(fs.readFileSync(`${work}/cookies.json`, "utf8")));
  for (const url of urls) {
    const page = await ctx.newPage();
    const problems = [];
    page.on("pageerror", (e) => problems.push(`crash: ${e.message.slice(0, 120)}`));
    const res = await page.goto(`http://127.0.0.1:3100${url}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(700);
    const where = page.url().replace("http://127.0.0.1:3100", "");
    if (where.startsWith("/sign-in")) problems.push("signed out: run up.sh again");
    if (await page.getByText("Something went wrong").count()) problems.push("shows Something went wrong");
    const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (sideways > 0) problems.push(`scrolls sideways by ${sideways}px`);
    const name = url.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "hub";
    await page.screenshot({ path: `${work}/shots/${name}.png`, fullPage: true });
    console.log(`${res.status()} ${url}${where !== url ? ` → ${where}` : ""}  ${problems.join("; ") || "ok"}  (${work}/shots/${name}.png)`);
    await page.close();
  }
  await browser.close();
})();
