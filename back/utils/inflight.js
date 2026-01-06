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
