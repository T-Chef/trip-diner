const _cache = new Map();

export function setCache(key, value, ttlMs) {
  const expires = Date.now() + ttlMs;
  _cache.set(key, { value, expires });
}

export function getCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    _cache.delete(key);
    return null;
  }

  return entry.value;
}
