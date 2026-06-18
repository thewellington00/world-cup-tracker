// Tiny in-memory TTL cache. Keeps us comfortably under football-data.org's
// free-tier rate limit (~10 requests/minute) by serving repeated requests
// from memory until the entry expires.
const store = new Map();

export function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function set(key, value, ttlMs) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

// Fetch-through helper: return cached value if fresh, otherwise run the
// loader, cache its result, and return it.
export async function cached(key, ttlMs, loader) {
  const hit = get(key);
  if (hit !== undefined) return hit;
  const value = await loader();
  return set(key, value, ttlMs);
}
