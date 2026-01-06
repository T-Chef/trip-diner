import { getCache, setCache } from "../../utils/cache.js";
import {
  cleanText,
  cleanOverview,
  buildTagsFromCategory,
} from "../../utils/textUtils.js";

import { isQuotaBlocked } from "../tour/quotaGuard.js";
import { fetchPlaceDetail } from "./placeTourApi.js";

import { enhanceWithNaverLocal } from "../naverService.js";
import { enhanceImage } from "../imageService.js";
import { makePlaceDetailFallback } from "./placeFallback.js";

export async function getPlaceDetail(reqQuery) {
  const {
    contentId,
    contentTypeId,
    title: fallbackTitle,
    address: fallbackAddress,
    tel: fallbackTel,
  } = reqQuery;

  if (!contentId) {
    const err = new Error("contentId 필요");
    err.status = 400;
    throw err;
  }
  if (!contentTypeId) {
    const err = new Error("contentTypeId 필요");
    err.status = 400;
    throw err;
  }

  const cacheKey = ["detail:v2", contentId, contentTypeId].join("|");
  const cached = getCache(cacheKey);
  if (cached) return { fromCache: true, data: cached };

  if (isQuotaBlocked()) {
    let tel = fallbackTel || "";
    let tags = [];

    try {
      const extra = await enhanceWithNaverLocal(
        fallbackTitle || "",
        fallbackAddress || ""
      );
      if (!tel && extra.tel) tel = extra.tel;
      if (extra.category)
        tags = buildTagsFromCategory(extra.category, contentTypeId);
    } catch {}

    const fb = makePlaceDetailFallback({
      contentId,
      contentTypeId,
      title: fallbackTitle,
      address: fallbackAddress,
      tel,
      tags,
      error: "TOUR_API_QUOTA_BLOCKED",
      message:
        "현재 TourAPI 호출 한도 초과 상태입니다. 잠시 후 다시 시도해 주세요.",
    });

    setCache(cacheKey, fb, 30 * 1000);
    return { quotaBlocked: true, data: fb };
  }

  try {
    const info = await fetchPlaceDetail({ contentId, contentTypeId });

    if (!info) {
      let tel = fallbackTel || "";
      let tags = [];

      try {
        const extra = await enhanceWithNaverLocal(
          fallbackTitle || "",
          fallbackAddress || ""
        );
        if (!tel && extra.tel) tel = extra.tel;
        if (extra.category)
          tags = buildTagsFromCategory(extra.category, contentTypeId);
      } catch {}

      const fb = makePlaceDetailFallback({
        contentId,
        contentTypeId,
        title: fallbackTitle,
        address: fallbackAddress,
        tel,
        tags,
        error: "DETAIL_EMPTY",
        message: "등록된 상세 정보가 없어 기본 정보만 표시합니다.",
      });

      setCache(cacheKey, fb, 60 * 1000);
      return { data: fb };
    }

    let tel = (info.tel || fallbackTel || "").trim();
    let tags = [];

    try {
      const extra = await enhanceWithNaverLocal(
        info.title || fallbackTitle || "",
        info.addr1 || fallbackAddress || ""
      );

      if (!tel && extra.tel) tel = extra.tel;
      if (extra.category)
        tags = buildTagsFromCategory(extra.category, contentTypeId);
      if (!tel || tel === "-" || tel === "없음") tel = "";
    } catch {}

    let finalImage = info.firstimage || null;
    try {
      if (!finalImage) {
        const enhancedImg = await enhanceImage(
          info.title,
          info.mapy,
          info.mapx
        );
        if (enhancedImg) finalImage = enhancedImg;
      }
    } catch {}

    const out = {
      contentId,
      contentTypeId,
      title: cleanText(info.title),
      address: cleanText(info.addr1),
      tel,
      overview: cleanOverview(info.overview),
      homepage: info.homepage,
      mapX: info.mapx,
      mapY: info.mapy,
      image: finalImage,
      tags,
      noDetail: false,
      error: null,
      message: null,
    };

    setCache(cacheKey, out, 10 * 60 * 1000);
    return { data: out };
  } catch (e) {
    let tel = fallbackTel || "";
    let tags = [];

    try {
      const extra = await enhanceWithNaverLocal(
        fallbackTitle || "",
        fallbackAddress || ""
      );
      if (!tel && extra.tel) tel = extra.tel;
      if (extra.category)
        tags = buildTagsFromCategory(extra.category, contentTypeId);
    } catch {}

    const fb = makePlaceDetailFallback({
      contentId,
      contentTypeId,
      title: fallbackTitle,
      address: fallbackAddress,
      tel,
      tags,
      error: e.code || "DETAIL_API_FAILED",
      message:
        e.code === "TOUR_API_QUOTA_EXCEEDED"
          ? "TourAPI 호출 한도 초과로 상세 정보를 불러올 수 없습니다. 잠시 후 재시도해 주세요."
          : "상세 정보를 불러오는 중 오류가 발생하여 기본 정보만 표시합니다.",
    });

    setCache(cacheKey, fb, 60 * 1000);
    return { data: fb };
  }
}
