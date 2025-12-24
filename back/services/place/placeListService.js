// back/services/place/placeListService.js
import { getCache, setCache } from "../../utils/cache.js";
import { cleanText } from "../../utils/textUtils.js";
import { mapWithConcurrency } from "../../utils/asyncUtils.js";

import { isQuotaBlocked } from "../tour/quotaGuard.js";
import { fetchPlaceList } from "./placeTourApi.js";

import { generateDescription } from "../../utils/aiDescription.js";
import { enhanceImage } from "../imageService.js";

const BANNED_PLACE_REGEX =
  /(pc방|피시방|피씨방|노래방|학원|고시원|독서실|스터디카페|원룸|부동산|대리운전|세차장|정비소|주유소|약국|병원|치과|한의원|점집|사무실|창고|사우나|찜질방)/i;

function isBannedPlaceRaw(p) {
  const s = `${p?.title ?? ""} ${p?.addr1 ?? ""} ${p?.addr2 ?? ""}`;
  return BANNED_PLACE_REGEX.test(s);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mixPopularRandom(list, topBucket = 50) {
  const sorted = [...list].sort((a, b) => (b.readcount ?? 0) - (a.readcount ?? 0));
  const top = sorted.slice(0, topBucket);
  const rest = sorted.slice(topBucket);
  return [...shuffle(top), ...rest];
}

function postProcess(baseList, { keyword, random, topBucket }) {
  const hasKeyword = Boolean((keyword ?? "").trim());
  
  if (hasKeyword) {
    return [...baseList].sort((a, b) => (b.readcount ?? 0) - (a.readcount ?? 0));
  }

  const randomOff = String(random) === "0";
  if (randomOff) {
    return [...baseList].sort((a, b) => (b.readcount ?? 0) - (a.readcount ?? 0));
  }

  const bucket = Math.max(10, Math.min(Number(topBucket ?? 50), 100));
  return mixPopularRandom(baseList, bucket);
}

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
    arrange,     
    random,      
    topBucket,   
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

  const arrangeMode = String(arrange || "B");

  const cacheKey = [
    "places:v4",
    areaCode,
    sigunguCode || "",
    contentTypeId || "",
    (keyword || "").trim(),
    rows,
    page,
    `arr:${arrangeMode}`,
    useAI ? "ai1" : "ai0",
    useEnhance ? "e1" : "e0",
  ].join("|");

  const cachedBase = getCache(cacheKey);
  if (cachedBase) {
    const out = postProcess(cachedBase, { keyword, random, topBucket });
    return { fromCache: true, data: out };
  }

  if (isQuotaBlocked()) return { quotaBlocked: true, data: [] };

  let items = await fetchPlaceList({
    areaCode,
    sigunguCode,
    contentTypeId,
    numOfRows: rows,
    pageNo: page,
    arrange: arrangeMode, 
  });

  items = items.filter((p) => !isBannedPlaceRaw(p));
  
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    items = items.filter((i) => {
      const t = (i.title || "").toLowerCase();
      const a = (i.addr1 || "").toLowerCase();
      return t.includes(kw) || a.includes(kw);
    });
  }

  const baseList = await mapWithConcurrency(items, 5, async (i, idx) => {
    const title = cleanText(i.title);
    const address = cleanText(i.addr1);

    let overview = "";
    if (address && title) overview = `${address}에 위치한 "${title}" 장소입니다.`;
    else if (title) overview = `"${title}"에 대한 소개가 아직 준비 중인 장소입니다.`;
    else overview = "이 장소에 대한 소개가 아직 준비 중입니다.";

    if (useAI && idx < 10) {
      try {
        const aiText = await generateDescription(title, address);
        if (aiText && aiText.trim()) overview = aiText.trim();
      } catch {}
    }

    let finalImage = i.firstimage || null;
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

      readcount: Number(i.readcount ?? 0),
    };
  });

  setCache(cacheKey, baseList, 5 * 60 * 1000);

  const out = postProcess(baseList, { keyword, random, topBucket });
  return { data: out };
}
