// back/apis/tourApi.js
import fetch from "node-fetch";
import "dotenv/config";

const SERVICE_KEY = process.env.TOUR_API_KEY;
const BASE_URL = "https://apis.data.go.kr/B551011/KorService2";

/**
 * 공통 fetch + 안전 파서
 */
async function callTourAPI(path, params) {
  const query =
    Object.entries(params)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

  const url = `${BASE_URL}${path}?serviceKey=${SERVICE_KEY}&${query}`;

  const res = await fetch(url);
  const text = await res.text();

  if (text.startsWith("Unauthorized") || text.includes("SERVICE ERROR")) {
    throw new Error("TourAPI Unauthorized or Service Error");
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error("JSON 파싱 실패 RAW:", text);
    throw e;
  }

  return json.response?.body?.items?.item || [];
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
 * AI가 준 place.name 과 cityName을 바탕으로 관광공사에서 정확한 장소 1개 찾아줌
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

  // ① cityName이 주소에 들어가면 우선 선택
  let best = items.find((i) => i.addr1 && cityName && i.addr1.includes(cityName));

  // ② 없으면 첫 번째 항목 선택
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
