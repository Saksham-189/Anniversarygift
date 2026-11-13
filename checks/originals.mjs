import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { content } from "../content.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "checks/original-photo-hashes.json"), "utf8"));
for (const entry of manifest) {
  const bytes = await readFile(path.join(root, entry.file));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256);
}
for (const photo of content.finale.surprise.photos) {
  const saved = await readFile(path.join(root, photo.src));
  const deployed = await readFile(path.join(root, "dist", photo.src));
  assert.ok(saved.equals(deployed), photo.src);
}
assert.equal(content.finale.surprise.mediaSrc, undefined);
console.log("PASS: original upload hashes unchanged; template uses exact original files, not a generated collage");
