class FeedbackStore {
  constructor({ maxEntries = 500 } = {}) {
    this.maxEntries = maxEntries;
    this.items = [];
  }

  add(entry) {
    this.items.push({
      ...entry,
      createdAt: Date.now()
    });
    if (this.items.length > this.maxEntries) {
      this.items.splice(0, this.items.length - this.maxEntries);
    }
  }

  recent(limit = 50) {
    const n = Math.max(1, Math.min(200, Number(limit) || 50));
    return this.items.slice(-n).reverse();
  }
}

module.exports = {
  FeedbackStore
};

