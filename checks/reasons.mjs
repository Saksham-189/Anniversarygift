import assert from "node:assert/strict";
import { createReasonDeck } from "../reasons.js";

const values = Array.from({ length: 15 }, (_, index) => `Reason ${index + 1}`);
const data = new Map();
const storage = {
  getItem: key => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, value)
};
const key = "anniversary.reasons.v1";
const getStorage = () => storage;

const deck = createReasonDeck(values, getStorage, () => 0);
assert.equal(deck.count, 0);
assert.equal(deck.current, null);
const first = Array.from({ length: 6 }, () => deck.reveal());
assert.equal(new Set(first).size, 6);
assert.equal(JSON.parse(data.get(key)).seen.length, 6);

// A new visit reshuffles the unread reasons, preserving the last note and count.
const resumed = createReasonDeck(values, getStorage, () => 0.75);
assert.equal(resumed.count, 6);
assert.equal(resumed.current, first.at(-1));
const rest = Array.from({ length: 9 }, () => resumed.reveal());
assert.equal(new Set([...first, ...rest]).size, 15);
assert.deepEqual([...first, ...rest].sort(), [...values].sort());
assert.equal(resumed.done, true);
assert.equal(resumed.reveal(), null);
assert.equal(resumed.count, 15);
resumed.reset();
assert.equal(resumed.count, 0);
assert.equal(resumed.current, null);
assert.equal(JSON.parse(data.get(key)).seen.length, 0);
assert.ok(resumed.reveal());

for (const getBlockedStorage of [
  () => { throw new Error("Storage getter blocked"); },
  () => ({ getItem() { throw new Error("Read blocked"); }, setItem() { throw new Error("Write blocked"); } })
]) {
  const blocked = createReasonDeck(values, getBlockedStorage);
  assert.equal(new Set(values.map(() => blocked.reveal())).size, values.length);
  assert.equal(blocked.done, true);
  blocked.reset();
  assert.equal(blocked.count, 0);
}

for (const seen of [[0, 0], [-1], [15], [0.5], ["1"], "bad"]) {
  data.set(key, JSON.stringify({ signature: JSON.stringify(values), seen }));
  assert.equal(createReasonDeck(values, getStorage).count, 0);
}
data.set(key, "invalid json");
assert.equal(createReasonDeck(values, getStorage).count, 0);
data.set(key, JSON.stringify({ signature: JSON.stringify(["Old reason"]), seen: [0] }));
assert.equal(createReasonDeck(values, getStorage).count, 0);
const empty = createReasonDeck([], getStorage);
assert.equal(empty.done, true);
assert.equal(empty.reveal(), null);
const duplicates = createReasonDeck(["A", "A", "", "  ", "B"], getStorage);
assert.equal(duplicates.total, 2);

console.log("PASS: shuffle, no repeats, resume, completion, reset, blocked storage, corrupt state, changed content, empty and duplicate reasons");
