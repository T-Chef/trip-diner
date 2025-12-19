// back/services/event/eventTourApi.js
// ✅ 이벤트(축제/행사) TourAPI 호출만 담당
// - quota/파싱/resultCode/timeout 처리는 services/tour/tourClient.js 공용 사용

import { buildTourUrl, fetchTourJson } from "../tour/tourClient.js";

const LIST_URL = "https://apis.data.go.kr/B551011/KorService2/searchFestival2";
const DETAIL_URL = "https://apis.data.go.kr/B551011/KorService2/detailCommon2";

const BASE_PARAMS = {
  MobileOS: "ETC",
  MobileApp: "TripDiner",
  _type: "json",
};

export async function fetchEventList({
  areaCode,
  sigunguCode,
  eventStartDate,
  eventEndDate,
}) {
  const url = buildTourUrl(LIST_URL, {
    ...BASE_PARAMS,
    numOfRows: "50",
    pageNo: "1",
    eventStartDate,
    eventEndDate,
    ...(areaCode ? { areaCode: String(areaCode).trim() } : {}),
    ...(sigunguCode ? { sigunguCode: String(sigunguCode).trim() } : {}),
  });

  const json = await fetchTourJson(url, {
    quotaBlockMs: 20 * 60 * 1000,
    timeoutMs: 8000,
  });

  const items = json?.response?.body?.items?.item || [];
  return items.map(mapEventListItem);
}

export async function fetchEventDetail({ contentId, contentTypeId }) {
  const url = buildTourUrl(DETAIL_URL, {
    ...BASE_PARAMS,
    contentId: String(contentId).trim(),
    contentTypeId: String(contentTypeId).trim(),
    defaultYN: "Y",
    overviewYN: "Y",
    firstImageYN: "Y",
    mapinfoYN: "Y",
  });

  const json = await fetchTourJson(url, {
    quotaBlockMs: 20 * 60 * 1000,
    timeoutMs: 8000,
  });

  const item = json?.response?.body?.items?.item;
  const info = Array.isArray(item) ? item[0] : item;
  return info || null;
}

function mapEventListItem(i) {
  return {
    contentId: i.contentid,
    contentTypeId: i.contenttypeid,
    title: i.title,
    address: i.addr1,
    image: i.firstimage,
    startDate: i.eventstartdate,
    endDate: i.eventenddate,
    tel: i.tel,
    mapX: i.mapx || null,
    mapY: i.mapy || null,
  };
}
