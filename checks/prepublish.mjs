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
let originalBytes = 0;
let audioBytes = 0;
async function checkFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await checkFiles(file);
    else {
      const original = file.includes(`${path.sep}originals${path.sep}`);
      assert.ok(!file.endsWith(".png") || original, `Unexpected PNG in publish output: ${file}`);
      bytes += (await stat(file)).size;
      if (original) originalBytes += (await stat(file)).size;
      if (file.endsWith(".mp3")) audioBytes += (await stat(file)).size;
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
assert.ok(bytes - originalBytes - audioBytes < 2_000_000, `Core output too heavy: ${bytes - originalBytes - audioBytes}`);
assert.ok(bytes < 25_000_000, `Optional media too heavy: ${bytes}`);
console.log(`PASS: publish content, date, preview metadata, assets; core ${bytes - originalBytes - audioBytes} bytes, on-demand originals ${originalBytes} bytes, tap-to-play audio ${audioBytes} bytes`);
