// services/cache.js
class TTLCache {
  constructor() { this.map = new Map(); }
  set(key, value, ttlMs = 30_000) {
    this.map.set(key, { value, exp: Date.now() + ttlMs });
  }
  get(key) {
    const v = this.map.get(key);
    if (!v) return null;
    if (Date.now() > v.exp) { this.map.delete(key); return null; }
    return v.value;
  }
  del(key) { this.map.delete(key); }
  clear() { this.map.clear(); }
}
module.exports = { TTLCache };
