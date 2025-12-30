import fetch from "node-fetch";
import "dotenv/config";
import https from "https";

const SERVICE_KEY = process.env.TOUR_API_KEY;
const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const httpsAgent = new https.Agent({ keepAlive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let queue = Promise.resolve();
let lastCallAt = 0;
const MIN_INTERVAL_MS = 400;
let dynamicIntervalMs = MIN_INTERVAL_MS;
function enqueueTourApi(fn) {
  const next = queue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, dynamicIntervalMs - (now - lastCallAt));
    if (wait > 0) await sleep(wait);
    lastCallAt = Date.now();
    return fn();
  }, fn);

  queue = next.catch(() => {});
  return next;
}

async function _callTourAPI(path, params, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 12000;

  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const url = `${BASE_URL}${path}?serviceKey=${SERVICE_KEY}&${query}`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      agent: httpsAgent,
      signal: controller.signal,
      headers: {
        "User-Agent": "TripDiner/1.0",
        Accept: "application/json",
      },
    });

    const text = await res.text();
    clearTimeout(t);

    // ✅ 429면 재시도 없이 바로 실패(혹은 그냥 [] 반환하고 싶으면 return []로 바꿔도 됨)
    if (res.status === 429) {
      dynamicIntervalMs = Math.min(2000, dynamicIntervalMs + 200);
      const err = new Error("TourAPI HTTP 429");
      err.httpStatus = 429;
      err.raw = text?.slice(0, 120);
      throw err;
    }

    if (!res.ok) {
      const err = new Error(`TourAPI HTTP ${res.status}`);
      err.httpStatus = res.status;
      err.raw = text?.slice(0, 120);
      throw err;
    }

    if (text.startsWith("Unauthorized") || text.includes("SERVICE ERROR")) {
      console.error("TourAPI Unauthorized or Service Error RAW:", text);
      return [];
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("JSON 파싱 실패 RAW:", text);
      return [];
    }
    dynamicIntervalMs = Math.max(MIN_INTERVAL_MS, dynamicIntervalMs - 50);

    return json.response?.body?.items?.item || [];
  } catch (err) {
    clearTimeout(t);
    if (err?.httpStatus === 429 || String(err?.message || "").includes("HTTP 429")) {
    return [];
  }
    console.error("TourAPI call failed:", err.code || err.name, err.message);
    return [];
  }
}

async function callTourAPI(path, params, opts = {}) {
  return enqueueTourApi(() => _callTourAPI(path, params, opts));
}

export async function getCities() {
  const items = await callTourAPI("/areaCode2", {
    numOfRows: 50,
    pageNo: 1,
    MobileOS: "WEB",
    MobileApp: "TripDiner",
    _type: "json",
  });

  return items.map((i) => ({
    areaCode: i.code,
    name: i.name,
  }));
}

export async function getDistricts(areaCode) {
  const items = await callTourAPI("/areaCode2", {
    numOfRows: 100,
    pageNo: 1,
    MobileOS: "WEB",
    MobileApp: "TripDiner",
    areaCode,
    _type: "json",
  });

  return items.map((i) => ({
    sigunguCode: i.code,
    name: i.name,
  }));
}

export async function getPlaces({ areaCode, sigunguCode, contentTypeId, numOfRows = 50 }) {
  const items = await callTourAPI("/areaBasedList2", {
    numOfRows,
    pageNo: 1,
    MobileOS: "WEB",
    MobileApp: "TripDiner",
    areaCode,
    sigunguCode,
    contentTypeId,
    listYN: "Y",
    arrange: "Q",
    _type: "json",
  });

  return items.map((p) => ({
    contentId: p.contentid,
    title: p.title,
    address: p.addr1,
    lat: p.mapy ? parseFloat(p.mapy) : null,
    lng: p.mapx ? parseFloat(p.mapx) : null,
    image: p.firstimage || null,
    overview: p.overview || "",
  }));
}

export async function searchPlaceByKeyword(keyword, cityName) {
  const items = await callTourAPI("/searchKeyword2", {
    keyword,
    numOfRows: 20,
    pageNo: 1,
    MobileOS: "WEB",
    MobileApp: "TripDiner",
    _type: "json",
  });

  if (!items || items.length === 0) return null;

  let best = items.find((i) => i.addr1 && cityName && i.addr1.includes(cityName));

  if (!best) best = items[0];

  return {
    contentId: best.contentid ?? null,
    name: best.title ?? null,
    address: best.addr1 ?? null,
    lat: best.mapy ? parseFloat(best.mapy) : null,
    lng: best.mapx ? parseFloat(best.mapx) : null,
    image: best.firstimage ?? null,
    homepage: best.homepage ?? null,
  };
}

