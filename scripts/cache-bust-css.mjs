import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = join(root, "assets", "styles.css");
const htmlPath = join(root, "index.html");

const css = readFileSync(cssPath);
const version = createHash("sha256").update(css).digest("hex").slice(0, 8);

const stylesheetPattern =
  /(<link rel="stylesheet" href=")\.\/assets\/styles\.css(?:\?v=[a-f0-9]+)?(")/;

let html = readFileSync(htmlPath, "utf8");

if (!stylesheetPattern.test(html)) {
  console.error("cache-bust-css: stylesheet link not found in index.html");
  process.exit(1);
}

html = html.replace(
  stylesheetPattern,
  `$1./assets/styles.css?v=${version}$2`,
);

writeFileSync(htmlPath, html);
console.log(`cache-bust-css: set stylesheet version to ${version}`);
