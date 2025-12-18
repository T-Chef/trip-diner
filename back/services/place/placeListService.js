// back/services/place/placeListService.js
import { getCache, setCache } from "../../utils/cache.js";
import { cleanText } from "../../utils/textUtils.js";
import { mapWithConcurrency } from "../../utils/asyncUtils.js";

import { isQuotaBlocked } from "../tour/quotaGuard.js";
import { fetchPlaceList } from "./placeTourApi.js";

import { generateDescription } from "../../utils/aiDescription.js";
import { enhanceImage } from "../imageService.js";

export async function getPlaces(reqQuery) {
  const {
    areaCode,
    sigunguCode,
    contentTypeId,
    keyword,
    numOfRows,
    pageNo,
    ai,
    enhance,
  } = reqQuery;

  if (!areaCode) {
    const err = new Error("areaCode 필요");
    err.status = 400;
    throw err;
  }

  const rows = Math.min(Number(numOfRows || 50), 200);
  const page = Math.max(Number(pageNo || 1), 1);

  const useAI = String(ai) === "1";
  const useEnhance = String(enhance) === "1";

  const cacheKey = [
    "places:v2",
    areaCode,
    sigunguCode || "",
    contentTypeId || "",
    (keyword || "").trim(),
    rows,
    page,
    useAI ? "ai1" : "ai0",
    useEnhance ? "e1" : "e0",
  ].join("|");

  const cached = getCache(cacheKey);
  if (cached) return { fromCache: true, data: cached };

  if (isQuotaBlocked()) return { quotaBlocked: true, data: [] };

  // ✅ TourAPI 호출은 여기서 1번만
  let items = await fetchPlaceList({
    areaCode,
    sigunguCode,
    contentTypeId,
    numOfRows: rows,
    pageNo: page,
  });

  // keyword 목록단 필터
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    items = items.filter((i) => {
      const t = (i.title || "").toLowerCase();
      const a = (i.addr1 || "").toLowerCase();
      return t.includes(kw) || a.includes(kw);
    });
  }

  const result = await mapWithConcurrency(items, 5, async (i, idx) => {
    const title = cleanText(i.title);
    const address = cleanText(i.addr1);

    // 기본 overview(목록용)
    let overview = "";
    if (address && title) overview = `${address}에 위치한 "${title}" 장소입니다.`;
    else if (title) overview = `"${title}"에 대한 소개가 아직 준비 중인 장소입니다.`;
    else overview = "이 장소에 대한 소개가 아직 준비 중입니다.";

    // (옵션) AI 설명 상위 10개만
    if (useAI && idx < 10) {
      try {
        const aiText = await generateDescription(title, address);
        if (aiText && aiText.trim()) overview = aiText.trim();
      } catch {}
    }

    // 이미지
    let finalImage = i.firstimage || null;

    // (옵션) 이미지 보강 상위 10개만
    if (!finalImage && useEnhance && idx < 10) {
      try {
        const enhancedImg = await enhanceImage(title, i.mapy, i.mapx);
        if (enhancedImg) finalImage = enhancedImg;
      } catch {}
    }

    return {
      contentId: i.contentid,
      contentTypeId: i.contenttypeid,
      title,
      address,
      tel: cleanText(i.tel),
      latitude: i.mapy,
      longitude: i.mapx,
      image: finalImage,
      overview,
    };
  });

  setCache(cacheKey, result, 5 * 60 * 1000);
  return { data: result };
}
