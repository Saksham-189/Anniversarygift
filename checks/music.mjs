import assert from "node:assert/strict";
import { initializeMusic } from "../music.js";
class Element {
  constructor(tag) { this.tag = tag; this.attributes = new Map(); this.children = []; this.events = new Map(); this.paused = true; this.currentTime = 0; this.playCalls = 0; }
  addEventListener(type, fn) { this.events.set(type, fn); }
  setAttribute(key, value) { this.attributes.set(key, value); }
  removeAttribute(key) { this.attributes.delete(key); }
  replaceChildren(...children) { this.children = children; }
  async play() {
    this.playCalls++;
    if (this.failPlay) throw new Error("Playback denied");
    this.paused = false;
    this.events.get("play")?.();
  }
  pause() { this.paused = true; this.events.get("pause")?.(); }
}
const toggle = new Element("button");
const panel = new Element("div");
const doc = { getElementById: id => id === "music-toggle" ? toggle : panel, createElement: tag => new Element(tag) };
const config = { src: "assets/audio/song.mp3", playLabel: "Play", pauseLabel: "Pause", loadingLabel: "Loading", retryLabel: "Retry" };
initializeMusic(config, doc);
const audio = panel.children[0];
assert.equal(audio.tag, "audio");
assert.equal(audio.src, config.src);
assert.equal(audio.preload, "none");
assert.equal(audio.loop, true);
assert.equal(audio.playCalls, 0, "No autoplay before a tap");
assert.equal(panel.hidden, true, "No video panel");
const first = toggle.events.get("click")();
const rapid = toggle.events.get("click")();
await Promise.all([first, rapid]);
assert.equal(audio.playCalls, 1);
assert.equal(toggle.textContent, "Pause");
assert.equal(toggle.attributes.get("aria-pressed"), "true");
audio.currentTime = 42;
await toggle.events.get("click")();
assert.equal(audio.paused, true);
assert.equal(audio.currentTime, 42, "Pause retains playback position");
assert.equal(toggle.textContent, "Play");
await toggle.events.get("click")();
assert.equal(panel.children[0], audio, "Resuming reuses the same global audio element");
assert.equal(audio.currentTime, 42);
audio.pause();
audio.failPlay = true;
await toggle.events.get("click")();
assert.equal(toggle.textContent, "Retry");
assert.equal(toggle.attributes.has("aria-disabled"), false);
console.log("PASS: audio-only playback, no autoplay, looping, rapid taps, pause/resume, accessible state and failed-play recovery");
