// back/utils/cache.js
const _cache = new Map();

/**
 * 메모리 캐시 저장
 */
export function setCache(key, value, ttlMs) {
  const expires = Date.now() + ttlMs;
  _cache.set(key, { value, expires });
}

/**
 * 메모리 캐시 조회 (만료되면 null)
 */
export function getCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    _cache.delete(key);
    return null;
  }

  return entry.value;
}
