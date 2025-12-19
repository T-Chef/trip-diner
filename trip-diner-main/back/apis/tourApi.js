// back/apis/tourApi.js
import fetch from "node-fetch";
import "dotenv/config";
import https from "https";

const SERVICE_KEY = process.env.TOUR_API_KEY;
const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

// ✅ 연결 안정화(keepAlive)
const httpsAgent = new https.Agent({ keepAlive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 공통 fetch + 안전 파서 + 타임아웃 + 재시도(ECONNRESET 대응)
 */
async function callTourAPI(path, params, opts = {}) {
  const retry = opts.retry ?? 3; // 기본 3회
  const timeoutMs = opts.timeoutMs ?? 12000; // 기본 12초

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

      // ✅ 5xx는 재시도 가치
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

      const isRetryableHttp = err?.httpStatus >= 500;

      if (attempt < retry && (isNetwork || isRetryableHttp)) {
        console.warn(
          `[TourAPI retry ${attempt}/${retry}]`,
          err.code || err.name || err.message,
          err.httpStatus || ""
        );
        await sleep(300 * attempt);
        continue;
      }

      console.error("TourAPI call failed (give up):", err.code || err.name, err.message);
      return [];
    }
  }

  return [];
}

/**
 * 1) 시/도 리스트 (areaCode2)
 */
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

/**
 * 2) 시/도 내 구/군 리스트 (areaCode2 + areaCode)
 */
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

/**
 * 3) 특정 시/도 + 구/군 + 카테고리(contentTypeId) 장소 리스트 (areaBasedList2)
 */
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

/**
 * ⭐ 4) 키워드 검색 후 가장 잘 맞는 장소 1개 반환 (searchKeyword2)
 */
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

  // ① cityName이 주소에 들어가면 우선
  let best = items.find((i) => i.addr1 && cityName && i.addr1.includes(cityName));

  // ② 없으면 첫번째
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
