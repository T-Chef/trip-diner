import { getCache, setCache } from "../../utils/cache.js";
import { dedup } from "../../utils/inflight.js";
import { searchPlaceNaver } from "../../apis/naverApi.js";
import {
  guessCityName,
  normalizeKeyword,
  pickPlaceHintFromAddress,
  removeCityDup,
  stripEventWords,
} from "./eventUtils.js";

export function normalizeNaverCoord(v) {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (Math.abs(n) > 1000) return n / 1e7;
  return n;
}

function buildLocalSearchCandidates({ title, address, cityName }) {
  const t0 = normalizeKeyword(title);
  const t1 = stripEventWords(t0);
  const aHint = pickPlaceHintFromAddress(address, cityName);

  const candidates = [
    aHint,
    removeCityDup(t1, cityName),
    removeCityDup(t0, cityName),
  ]
    .map((s) => normalizeKeyword(s))
    .filter(Boolean);

  return [...new Set(candidates)];
}

export async function naverSearchOnce(title, address) {
  const cityName = guessCityName(address);
  const candidates = buildLocalSearchCandidates({ title, address, cityName });
  if (candidates.length === 0) return [];

  for (const kw of candidates) {
    const cacheKey = ["event|naver|search", cityName || "all", kw].join("|");
    const cached = getCache(cacheKey);
    if (cached) return cached;

    const { p, shared } = dedup(cacheKey, () => searchPlaceNaver(kw, cityName));
    let list = [];
    try {
      list = await p;
    } catch {
      list = [];
    }

    if (!Array.isArray(list)) list = [];
    if (!shared) {
      console.log("🔍 NAVER 로컬 시도:", {
        cityName,
        keyword: kw,
        len: list.length,
      });
    }

    if (list.length > 0) {
      setCache(cacheKey, list, 10 * 60 * 1000);
      return list;
    }

    setCache(cacheKey, [], 30 * 1000);
  }

  return [];
}

export function pickBestNaverItem(items, tourAddress = "", title = "") {
  const addr = String(tourAddress || "");
  const t = normalizeKeyword(title);

  let best = null;
  let bestScore = -1;

  for (const it of items || []) {
    const road = String(it.address || "");
    const tt = normalizeKeyword(it.title || "");

    let score = 0;
    if (road && addr && addr.includes(road)) score += 50;
    if (road && addr && road.includes(addr.split(" ")[0])) score += 10;
    if (t && tt && (t.includes(tt) || tt.includes(t))) score += 20;

    const cat = String(it.category || "");
    if (/해수욕장|관광|명소|공원|광장/.test(cat)) score += 5;

    if (score > bestScore) {
      bestScore = score;
      best = it;
    }
  }

  return best || items?.[0] || null;
}
