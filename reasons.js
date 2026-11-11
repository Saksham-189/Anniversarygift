// Keep deck state separate from the unfolding effect so rapid taps cannot skip notes.
export function createReasonDeck(values, getStorage = () => window.localStorage, random = Math.random) {
  const reasons = [...new Set(values.filter(value => typeof value === "string" && value.trim()))];
  const key = "anniversary.reasons.v1";
  const signature = JSON.stringify(reasons);
  let seen = [];

  try {
    const saved = JSON.parse(getStorage().getItem(key));
    if (saved?.signature === signature && Array.isArray(saved.seen)
        && saved.seen.length <= reasons.length
        && new Set(saved.seen).size === saved.seen.length
        && saved.seen.every(index => Number.isInteger(index) && index >= 0 && index < reasons.length)) {
      seen = [...saved.seen];
    }
  } catch {
    // Storage access, invalid JSON, and private browsing must never block a note.
  }

  function shuffleRemaining() {
    const remaining = reasons.map((_, index) => index).filter(index => !seen.includes(index));
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    return remaining;
  }

  let remaining = shuffleRemaining();
  function persist() {
    try {
      getStorage().setItem(key, JSON.stringify({ signature, seen }));
    } catch {
      // The current visit still works when saving is unavailable.
    }
  }

  return {
    get count() { return seen.length; },
    get total() { return reasons.length; },
    get done() { return seen.length === reasons.length; },
    get current() { return seen.length ? reasons[seen[seen.length - 1]] : null; },
    reveal() {
      if (!remaining.length) return null;
      seen.push(remaining.shift());
      persist();
      return this.current;
    },
    reset() {
      seen = [];
      remaining = shuffleRemaining();
      persist();
    }
  };
}
