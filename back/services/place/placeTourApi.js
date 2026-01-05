// back/services/place/placeTourApi.js
import { buildTourUrl, fetchTourJson } from "../tour/tourClient.js";

const LIST_URL = "https://apis.data.go.kr/B551011/KorService2/areaBasedList2";
const DETAIL_URL = "https://apis.data.go.kr/B551011/KorService2/detailCommon2";

const BASE_PARAMS = {
  MobileOS: "ETC",
  MobileApp: "TripDiner",
  _type: "json",
};

const hasValue = (v) => v !== null && v !== undefined && String(v).trim() !== "";

export async function fetchPlaceList({
  areaCode,
  sigunguCode,
  contentTypeId,
  numOfRows,
  pageNo,
  arrange,
}) {
  const url = buildTourUrl(LIST_URL, {
    ...BASE_PARAMS,
    numOfRows: String(numOfRows ?? 50),
    pageNo: String(pageNo ?? 1),
    areaCode: String(areaCode),

    // ✅ 기본 인기(조회수) 정렬
    arrange: String(arrange ?? "D"),

    ...(hasValue(sigunguCode) ? { sigunguCode: String(sigunguCode) } : {}),
    ...(hasValue(contentTypeId) ? { contentTypeId: String(contentTypeId) } : {}),
  });

  const json = await fetchTourJson(url, { quotaBlockMs: 60 * 1000 });
  return json?.response?.body?.items?.item || [];
}

export async function fetchPlaceDetail({ contentId, contentTypeId }) {
  const url = buildTourUrl(DETAIL_URL, {
    ...BASE_PARAMS,
    contentId: String(contentId),
    contentTypeId: String(contentTypeId),
    defaultYN: "Y",
    overviewYN: "Y",
    addrinfoYN: "Y",
    imageYN: "Y",
    mapinfoYN: "Y",
  });

  const json = await fetchTourJson(url, { quotaBlockMs: 60 * 1000 });

  const item = json?.response?.body?.items?.item;
  const info = Array.isArray(item) ? item[0] : item;
  return info || null;
}
