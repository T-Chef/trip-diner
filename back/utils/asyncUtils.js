export async function mapWithConcurrency(list, limit, mapper) {
  const results = new Array(list.length);
  let idx = 0;

  const workers = new Array(Math.min(limit, list.length)).fill(null).map(async () => {
    while (idx < list.length) {
      const cur = idx++;
      results[cur] = await mapper(list[cur], cur);
    }
  });

  await Promise.all(workers);
  return results;
}
