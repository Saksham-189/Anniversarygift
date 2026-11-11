import { readFile, writeFile, mkdir, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { content } from "../content.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function checkContent(value, key = "content") {
  if (typeof value === "string" && /\[\[[^\]]+\]\]/.test(value)) throw new Error(`Unfilled placeholder: ${key}`);
  if (value && typeof value === "object") for (const [name, item] of Object.entries(value)) checkContent(item, `${key}.${name}`);
}
checkContent(content);
const origin = new URL(content.meta.siteUrl).origin;
const escape = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
let html = await readFile(path.join(root, "index.html"), "utf8");
html = html.replace(/<title>[^<]*<\/title>/, `<title>${escape(content.meta.pageTitle)}</title>`);
for (const [selector, value] of [
  ['name="description"', content.meta.shareDescription],
  ['property="og:title"', content.meta.pageTitle],
  ['property="og:description"', content.meta.shareDescription],
  ['property="og:image"', `${origin}/assets/og-image.jpg`]
]) {
  const expression = new RegExp(`<meta ${selector} content="[^"]*">`);
  html = html.replace(expression, `<meta ${selector} content="${escape(value)}">`);
}
const extra = [
  `<meta property="og:url" content="${origin}/">`,
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  `<meta property="og:image:alt" content="${escape(content.meta.pageTitle)}. A personal anniversary letter.">`,
  '<meta name="twitter:card" content="summary_large_image">'
].join("\n    ");
html = html.replace(/\s*<!-- share-meta:start -->[\s\S]*?<!-- share-meta:end -->/, "");
html = html.replace("    <title>", `    <!-- share-meta:start -->\n    ${extra}\n    <!-- share-meta:end -->\n    <title>`);
await writeFile(path.join(root, "index.html"), html);
const files = ["index.html", "styles.css", "app.js", "content.js", "reasons.js", "surprise.js"];
const assets = new Set(["assets/og-image.jpg"]);
for (const file of files) {
  const source = await readFile(path.join(root, file), "utf8");
  for (const match of source.matchAll(/assets\/[a-zA-Z0-9_./-]+/g)) assets.add(match[0]);
}
await mkdir(path.join(root, "dist"), { recursive: true });
let bytes = 0;
for (const file of [...files, ...assets]) {
  const target = path.join(root, "dist", file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(root, file), target);
  bytes += (await stat(target)).size;
}
console.log(JSON.stringify({status:"ready",files:files.length+assets.size,total_bytes:bytes,origin}));
