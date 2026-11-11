import assert from "node:assert/strict";
import { renderSurprise, resolveSurpriseSource } from "../surprise.js";

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.handlers = new Map(); this.attributes = new Map(); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(type, fn) { this.handlers.set(type, fn); }
  setAttribute(key, value) { this.attributes.set(key, value); }
  removeAttribute(key) { this.attributes.delete(key); if (key === "src") this.src = undefined; }
  pause() { this.pausedByCleanup = true; }
  load() { this.released = true; }
}
const doc = { baseURI: "https://example.test/anniversary/", createElement: tag => new Element(tag) };
const labels = { linkLabel: "Open surprise", photoLinkLabel: "View photo full size", videoLabel: "Your video", unavailableText: "Not ready yet" };
assert.equal(resolveSurpriseSource("assets/test.jpg", doc.baseURI), "https://example.test/anniversary/assets/test.jpg");
for (const source of ["", "[[SOURCE]]", "javascript:alert(1)", "data:text/html,test", "file:///private", "https://["]) {
  assert.equal(resolveSurpriseSource(source, doc.baseURI), null);
}
for (const type of ["message", "photo", "video", "link"]) {
  const panel = new Element("section");
  const cleanup = renderSurprise(panel, {
    type, text: "A <special> line & a little love", mediaSrc: "assets/surprise.mp4", photoAlt: "Our photo"
  }, labels, doc);
  assert.equal(panel.children[0].textContent, "A <special> line & a little love");
  assert.equal(panel.children.length, type === "message" ? 1 : type === "photo" ? 3 : 2);
  const media = panel.children[1];
  if (type === "photo") {
    assert.equal(media.tag, "img");
    assert.equal(media.alt, "Our photo");
    assert.equal(panel.children[2].target, "_blank");
    assert.equal(panel.children[2].rel, "noopener noreferrer");
    media.handlers.get("error")();
    assert.equal(media.hidden, true);
    assert.equal(panel.children[2].hidden, true);
    assert.equal(panel.children.at(-1).textContent, labels.unavailableText);
  }
  if (type === "video") {
    assert.equal(media.tag, "video");
    assert.equal(media.controls, true);
    assert.equal(media.playsInline, true);
    assert.equal(media.preload, "none");
    assert.notEqual(media.autoplay, true);
  }
  if (type === "link") {
    assert.equal(media.tag, "a");
    assert.equal(media.target, "_blank");
    assert.equal(media.rel, "noopener noreferrer");
  }
  cleanup();
  if (type === "video") {
    assert.equal(media.pausedByCleanup, true);
    assert.equal(media.released, true);
  }
}
for (const type of ["photo", "video", "link", "unknown"]) {
  const panel = new Element("section");
  renderSurprise(panel, { type, text: "Hello", mediaSrc: "" }, labels, doc);
  assert.equal(panel.children.at(-1).textContent, labels.unavailableText);
}
console.log("PASS: all four surprise types, safe URLs, plain text, missing media, video controls and cleanup");
