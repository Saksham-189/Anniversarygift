import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { content } from "../content.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function validate(value, key = "content") {
  if (typeof value === "string") assert.ok(!/\[\[[^\]]+\]\]/.test(value), `Placeholder at ${key}`);
  else if (value && typeof value === "object") for (const [name, item] of Object.entries(value)) validate(item, `${key}.${name}`);
}
validate(content);
assert.equal(content.meta.anniversaryDate, "2026-11-12");
assert.equal(content.meta.yourName, "Saksham");
const html = await readFile(path.join(root, "dist/index.html"), "utf8");
for (const fragment of [
  '<html lang="en">', 'name="robots" content="noindex"',
  `<title>${content.meta.pageTitle}</title>`,
  `property="og:image" content="${content.meta.siteUrl}/assets/og-image.jpg"`,
  'property="og:image:width" content="1200"', 'property="og:image:height" content="630"'
]) assert.ok(html.includes(fragment), fragment);
let bytes = 0;
async function checkFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await checkFiles(file);
    else {
      assert.ok(!file.endsWith(".png"), `Uncompressed original in publish output: ${file}`);
      bytes += (await stat(file)).size;
      if (/\.(html|js|css|svg)$/.test(file)) {
        const source = await readFile(file, "utf8");
        for (const match of source.matchAll(/assets\/[a-zA-Z0-9_./-]+/g)) {
          assert.ok((await stat(path.join(root, "dist", match[0]))).isFile(), match[0]);
        }
      }
    }
  }
}
await checkFiles(path.join(root, "dist"));
assert.ok(bytes < 2_000_000, `Static output too heavy: ${bytes}`);
console.log(`PASS: publish content, 2026 date, preview metadata, asset paths and optimized output (${bytes} bytes)`);
