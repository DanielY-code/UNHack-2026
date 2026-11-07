// Bundles the app into one self-contained HTML file (CSS, scripts and /data content inlined).
// Useful for sharing a preview as a single file or publishing it as a claude.ai artifact.
// Usage: node scripts/build-single.mjs [out=dist/edventure.html] [--fragment]
//   --fragment  omit <!doctype>/<html>/<head>/<body> (for hosts that add their own document skeleton)
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const args = process.argv.slice(2);
const fragment = args.includes("--fragment");
const out = args.find((a) => !a.startsWith("--")) || "dist/edventure.html";

const read = (p) => readFileSync(join(root, p), "utf8");
const html = read("index.html");
const content = Object.fromEntries(
  readdirSync(join(root, "data")).filter((f) => f.endsWith(".json")).map((f) => [f.replace(".json", ""), JSON.parse(read(`data/${f}`))]),
);
const scripts = [...html.matchAll(/<script src="(js\/[^"]+)" defer><\/script>/g)].map((m) => m[1]);
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");

const headExtras = [...html.matchAll(/<link [^>]*fonts[^>]*>/g)].map((m) => m[0]).join("\n");
const body = html.slice(html.indexOf("<body>") + 6, html.indexOf("<noscript>")).trim();
const inline =
  `<style>\n${read("css/styles.css")}\n</style>\n` +
  `${body}\n` +
  `<script>window.__CONTENT__=${safe(JSON.stringify(content))};</script>\n` +
  scripts.map((s) => `<script>\n/* ${s} */\n${safe(read(s))}\n</script>`).join("\n");

const doc = fragment
  ? `<title>Edventure</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n${headExtras}\n${inline}\n`
  : `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<title>Edventure</title>\n${headExtras}\n</head>\n<body>\n${inline}\n</body>\n</html>\n`;

const target = resolve(root, out);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, doc);
console.log(`Wrote ${out} (${(doc.length / 1024).toFixed(0)} KB, ${scripts.length} scripts, ${Object.keys(content).length} content files)`);
