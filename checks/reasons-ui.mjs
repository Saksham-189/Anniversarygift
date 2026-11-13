import assert from "node:assert/strict";

// Exercise the actual handlers with controlled animation completion and no browser storage.
for (const reducedMotion of [false, true]) {
  const nodes = new Map();
  const pending = [];
  const timelinePhotos = [{ loading: "lazy" }, { loading: "lazy" }];
  let animationCount = 0;
  class Element {
    constructor() {
      this.handlers = new Map();
      this.attributes = new Map();
      this.classList = { add() {}, remove() {}, toggle() {} };
    }
    addEventListener(type, fn) { this.handlers.set(type, fn); }
    trigger(type) { return this.handlers.get(type)?.(); }
    append() {}
    replaceChildren() {}
    setAttribute(key, value) { this.attributes.set(key, value); }
    removeAttribute(key) { this.attributes.delete(key); }
    focus() { document.activeElement = this; }
    animate() {
      animationCount++;
      let finish;
      const finished = new Promise(resolve => { finish = resolve; });
      pending.push(finish);
      return { finished, finish, cancel() {} };
    }
  }
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, new Element());
    return nodes.get(id);
  };
  globalThis.document = {
    documentElement: { lang: "en" },
    getElementById: node,
    querySelector: node,
    querySelectorAll: selector => selector === "#timeline img" ? timelinePhotos : [],
    createElement: () => new Element()
  };
  globalThis.window = {
    matchMedia: () => ({ matches: reducedMotion, addEventListener() {} }),
    get localStorage() { throw new Error("Storage blocked"); },
    scrollTo() {}
  };
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => "linear" });
  async function settle() {
    for (let i = 0; i < 12; i++) {
      pending.splice(0).forEach(finish => finish());
      await Promise.resolve();
    }
  }
  await import(`../app.js?motion=${reducedMotion}`);
  await settle();
  const reveal = node("reason-reveal");
  const seen = [];
  for (let i = 1; i <= 10; i++) {
    const first = reveal.trigger("click");
    const rapidTap = reveal.trigger("click");
    assert.equal(node("reasons-complete").hidden, true);
    await settle();
    await Promise.all([first, rapidTap]);
    assert.equal(node("reason-progress").textContent, `${i} of 10`);
    assert.equal(reveal.attributes.has("aria-disabled"), false);
    seen.push(node("reason-text").textContent);
  }
  assert.equal(new Set(seen).size, 10);
  assert.equal(reveal.hidden, true);
  assert.equal(node("reasons-complete").hidden, false);
  assert.equal(document.activeElement, node("reasons-continue"));
  node("reasons-reset").trigger("click");
  assert.equal(node("reason-progress").textContent, "0 of 10");
  assert.equal(document.activeElement, reveal);
  assert.equal(reveal.hidden, false);
  assert.equal(node("reasons-complete").hidden, true);
  assert.equal(animationCount, reducedMotion ? 0 : 21);

  // Complete a fresh deck, open the finale, reveal the surprise, then replay.
  for (let i = 0; i < 10; i++) {
    const action = reveal.trigger("click");
    await settle();
    await action;
  }
  const enterFinale = node("reasons-continue").trigger("click");
  await settle();
  await enterFinale;
  assert.equal(node("finale").hidden, false);
  assert.equal(node("finale").inert, false);
  assert.equal(document.activeElement, node("finale-heading"));
  const surprise = node("surprise-button").trigger("click");
  await settle();
  await surprise;
  assert.equal(node("surprise-panel").hidden, false);
  assert.equal(node("surprise-button").attributes.get("aria-expanded"), "true");
  const replay = node("replay-button").trigger("click");
  const doubleReplay = node("replay-button").trigger("click");
  await settle();
  await Promise.all([replay, doubleReplay]);
  assert.equal(node("welcome").hidden, false);
  assert.equal(node("welcome").inert, false);
  assert.equal(document.activeElement, node("welcome-headline"));
  for (const id of ["timeline", "reasons", "finale"]) {
    assert.equal(node(id).hidden, true);
    assert.equal(node(id).inert, true);
  }
  assert.equal(node("reason-progress").textContent, "0 of 10");
  assert.equal(node("surprise-panel").hidden, true);
  assert.equal(node("surprise-button").attributes.get("aria-expanded"), "false");
  const beginAgain = node("begin-button").trigger("click");
  await settle();
  await beginAgain;
  assert.equal(node("timeline").inert, false);
  assert.ok(timelinePhotos.every(image => image.loading === "eager"));
  const continueAgain = node("timeline-continue").trigger("click");
  await settle();
  await continueAgain;
  assert.equal(node("reasons").inert, false);
  assert.equal(node("reason-progress").textContent, "0 of 10");
  if (reducedMotion) assert.equal(animationCount, 0);
}
console.log("PASS: reveals, double-tap guard, reset, finale, surprise, replay and second visit; default/reduced motion and blocked storage");
