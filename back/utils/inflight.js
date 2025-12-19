// back/utils/inflight.js
// 동일한 key로 동시에 여러 번 호출되는 비싼 작업(외부 API/스크래핑 등)을 1회만 수행하기 위한 dedupe

const _inflight = new Map();

/**
 * @param {string} key
 * @param {() => Promise<any>} fn
 * @returns {{ p: Promise<any>, shared: boolean }}
 */
export function dedup(key, fn) {
  if (_inflight.has(key)) return { p: _inflight.get(key), shared: true };

  const p = (async () => {
    try {
      return await fn();
    } finally {
      _inflight.delete(key);
    }
  })();

  _inflight.set(key, p);
  return { p, shared: false };
}
