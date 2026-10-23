# Laptop pass (23 Oct 2026)

The owner asked for every desktop screen to get the mobile look and feel, laid
out for a laptop, kept responsive (no pixel-perfect widths), and to be done
without stopping to ask. Everything is behind `lg:` (1024px and up), so phones
don't change; no database, data or new tabs. Each page was photographed on the
private copy at 1440px (`CHECK_WIDTH=1440 node scripts/check/shoot.cjs …`,
`bash scripts/check/rebuild.sh` after a change) before it was pushed.

Rule used: tab pages use the full width; pages that read like paper (menu,
forms) are narrow and centred with their tools beside them; the rest are two
columns, summary on one side and the lists on the other.

| Page | What changed | Look at |
|---|---|---|
| Settings | Two columns: the wedding, who has a login, your login down the left; the areas beside them in two columns | the areas rows still read cleanly at 1024px |
