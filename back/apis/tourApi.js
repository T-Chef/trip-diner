import fetch from "node-fetch";
import "dotenv/config";
import https from "https";

const SERVICE_KEY = process.env.TOUR_API_KEY;
const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";
const httpsAgent = new https.Agent({ keepAlive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let queue = Promise.resolve();
function enqueueTourApi(fn) {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {}); // 큐 끊기 방지
  return next;
}

async function callTourAPI(path, params, opts = {}) {
  const retry = opts.retry ?? 5;          // ✅ 3 → 5 정도로
  const timeoutMs = opts.timeoutMs ?? 12000;

  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");

  const url = `${BASE_URL}${path}?serviceKey=${SERVICE_KEY}&${query}`;

  for (let attempt = 1; attempt <= retry; attempt++) {
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

      // ✅ 429면 더 길게 쉬었다가 재시도
      if (res.status === 429) {
        // Retry-After 헤더가 있으면 그걸 우선 사용(초 단위인 경우가 많음)
        const ra = res.headers.get("retry-after");
        const retryAfterMs = ra ? Number(ra) * 1000 : null;

        // 없으면 지수 백오프(500ms, 1000ms, 2000ms...) + 약간 랜덤
        const backoff =
          retryAfterMs ??
          Math.min(8000, 500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 200);

        if (attempt < retry) {
          console.warn(`[TourAPI 429] wait ${backoff}ms then retry ${attempt}/${retry}`);
          await sleep(backoff);
          continue;
        }
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

      return json.response?.body?.items?.item || [];
    } catch (err) {
      clearTimeout(t);

      const isNetwork =
        err?.name === "AbortError" ||
        err?.code === "ECONNRESET" ||
        err?.code === "ETIMEDOUT" ||
        err?.code === "ECONNREFUSED";

      // ✅ 429도 재시도 대상으로 포함 + 503 같은 것도 포함
      const isRetryableHttp =
        err?.httpStatus === 429 ||
        err?.httpStatus === 503 ||
        err?.httpStatus >= 500;

      if (attempt < retry && (isNetwork || isRetryableHttp)) {
        const backoff = Math.min(8000, 400 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 200);
        console.warn(
          `[TourAPI retry ${attempt}/${retry}] wait ${backoff}ms`,
          err.code || err.name || err.message,
          err.httpStatus || ""
        );
        await sleep(backoff);
        continue;
      }

      console.error("TourAPI call failed (give up):", err.code || err.name, err.message);
      return [];
    }
  }

  return [];
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

