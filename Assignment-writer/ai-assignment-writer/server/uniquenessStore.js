const { hashText } = require('./contentQuality');

class UniquenessStore {
  constructor({ maxEntries = 200, ttlMs = 6 * 60 * 60 * 1000 } = {}) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
    this.map = new Map();
  }

  has(text) {
    const h = hashText(text);
    const ts = this.map.get(h);
    if (!ts) return false;
    if (Date.now() - ts > this.ttlMs) {
      this.map.delete(h);
      return false;
    }
    return true;
  }

  add(text) {
    const h = hashText(text);
    this.map.set(h, Date.now());
    if (this.map.size > this.maxEntries) {
      const keys = Array.from(this.map.keys());
      for (let i = 0; i < Math.max(0, this.map.size - this.maxEntries); i++) {
        this.map.delete(keys[i]);
      }
    }
    return h;
  }
}

module.exports = {
  UniquenessStore
};

