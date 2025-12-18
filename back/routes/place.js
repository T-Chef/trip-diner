// back/routes/place.js
import express from "express";
import "dotenv/config";

import { generateDescription } from "../utils/aiDescription.js";
import { setCache, getCache } from "../utils/cache.js";
import {
  cleanText,
  cleanOverview,
  buildTagsFromCategory,
} from "../utils/textUtils.js";

import { enhanceWithNaverLocal } from "../services/naverService.js";
import { enhanceImage } from "../services/imageService.js";
import { PrismaClient } from "@prisma/client";


const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;
const prisma = new PrismaClient();
const toJsonSafe = (data) =>
  JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );

/* -------------------------------------------------------
   ✅ TourAPI quota 감지 + 전역 락 (중요)
------------------------------------------------------- */
let quotaBlockedUntil = 0;
const isQuotaBlocked = () => Date.now() < quotaBlockedUntil;
const blockQuota = (ms = 60 * 1000) => {
  quotaBlockedUntil = Date.now() + ms;
};

const hasQuotaMessage = (raw) =>
  typeof raw === "string" && raw.includes("API token quota exceeded");

// TourAPI 호출 공통 (text로 받고 quota 먼저 체크 → JSON 파싱)
async function fetchTourJson(url) {
  const res = await fetch(url);
  const raw = await res.text();

  if (hasQuotaMessage(raw)) {
    blockQuota(60 * 1000);
    const err = new Error("TOUR_API_QUOTA_EXCEEDED");
    err.code = "TOUR_API_QUOTA_EXCEEDED";
    err.raw = raw;
    throw err;
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    const err = new Error("TOUR_API_PARSE_FAILED");
    err.code = "TOUR_API_PARSE_FAILED";
    err.raw = raw;
    throw err;
  }
}

/* 공통: 상세 fallback 응답 생성 */
function makeDetailFallback({
  contentId,
  contentTypeId,
  title,
  address,
  tel = "",
  tags = [],
  error,
  message,
}) {
  return {
    contentId,
    contentTypeId,
    title: title || "상세 정보를 불러오지 못했습니다.",
    address: address || "",
    tel: tel || "",
    overview: "",
    homepage: "",
    mapX: null,
    mapY: null,
    image: null,
    tags,
    noDetail: true,
    error,
    message,
  };
}

/* 간단 동시성 제한 (외부 API 폭주 방지) */
async function mapWithConcurrency(list, limit, mapper) {
  const results = new Array(list.length);
  let idx = 0;

  const workers = new Array(Math.min(limit, list.length)).fill(null).map(async () => {
    while (idx < list.length) {
      const cur = idx++;
      results[cur] = await mapper(list[cur], cur);
    }
  });

  await Promise.all(workers);
  return results;
}

/* -------------------------------------------------------
   1) 관광지 목록 조회 (✅ N번 detailCommon 호출 제거 버전)
------------------------------------------------------- */
router.get("/places", async (req, res) => {
  const {
    areaCode,
    sigunguCode,
    contentTypeId,
    keyword,
    numOfRows,
    pageNo,
    ai,       // optional: ai=1 일 때만 AI 설명 생성
    enhance,  // optional: enhance=1 일 때만 이미지 보강
  } = req.query;

  if (!areaCode) return res.status(400).json({ error: "areaCode 필요" });

  const rows = Math.min(Number(numOfRows || 50), 200); // ✅ 기본 50, 최대 200
  const page = Math.max(Number(pageNo || 1), 1);

  const cacheKey = [
    "places:v2",
    areaCode,
    sigunguCode || "",
    contentTypeId || "",
    (keyword || "").trim(),
    rows,
    page,
    ai ? "ai1" : "ai0",
    enhance ? "e1" : "e0",
  ].join("|");

  const cached = getCache(cacheKey);
  if (cached) {
    res.setHeader("X-From-Cache", "1");
    return res.json(cached);
  }

  // ✅ 전역 quota 락이면, 외부 TourAPI 호출하지 않음 (폭주 방지)
  if (isQuotaBlocked()) {
    res.setHeader("X-Quota-Blocked", "1");
    // 목록은 프론트가 배열 기대하는 경우가 많아서 [] 반환
    return res.json([]);
  }

  try {
    const params = new URLSearchParams({
      serviceKey: TOUR_API_KEY,
      MobileOS: "ETC",
      MobileApp: "TripDiner",
      _type: "json",
      numOfRows: String(rows),
      pageNo: String(page),
      areaCode: String(areaCode),
    });

    if (sigunguCode) params.set("sigunguCode", String(sigunguCode));
    if (contentTypeId) params.set("contentTypeId", String(contentTypeId));

    const url = `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?${params.toString()}`;
    const data = await fetchTourJson(url);

    let items = data?.response?.body?.items?.item || [];

    // ✅ keyword가 있으면, TourAPI 목록단에서 먼저 필터(가벼움)
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      items = items.filter((i) => {
        const t = (i.title || "").toLowerCase();
        const a = (i.addr1 || "").toLowerCase();
        return t.includes(kw) || a.includes(kw);
      });
    }

    const useAI = String(ai) === "1";
    const useEnhance = String(enhance) === "1";

    // ✅ 목록에서는 overview를 "기본 문구"로 생성 (detailCommon2 호출 금지!)
    // ✅ AI/이미지 보강은 옵션 + 소수만 + 동시성 제한
    const result = await mapWithConcurrency(items, 5, async (i, idx) => {
      const contentId = i.contentid;
      const typeId = i.contenttypeid;

      const title = cleanText(i.title);
      const address = cleanText(i.addr1);

      // 기본 overview (목록용)
      let overview = "";
      if (address && title) overview = `${address}에 위치한 "${title}" 장소입니다.`;
      else if (title) overview = `"${title}"에 대한 소개가 아직 준비 중인 장소입니다.`;
      else overview = "이 장소에 대한 소개가 아직 준비 중입니다.";

      // (옵션) AI 설명: 상위 10개만
      if (useAI && idx < 10) {
        try {
          const aiText = await generateDescription(title, address);
          if (aiText && aiText.trim()) overview = aiText.trim();
        } catch (e) {
          // AI 실패해도 기본 overview 유지
        }
      }

      // 이미지
      let finalImage = i.firstimage || null;

      // (옵션) 이미지 보강: 상위 10개만
      if (!finalImage && useEnhance && idx < 10) {
        try {
          const enhancedImg = await enhanceImage(title, i.mapy, i.mapx);
          if (enhancedImg) finalImage = enhancedImg;
        } catch {}
      }

      return {
        contentId,
        contentTypeId: typeId,
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
    return res.json(result);
  } catch (err) {
    console.error("🔥 Place /places Error:", err.code || err.message, err.raw || "");

    // 쿼터 초과면 전역락 걸려있고, 목록은 빈 배열 반환(프론트 안정성)
    if (err.code === "TOUR_API_QUOTA_EXCEEDED") {
      res.setHeader("X-Quota-Blocked", "1");
      return res.json([]);
    }

    return res.status(502).json({
      ok: false,
      error: err.code || "TOUR_API_FAILED",
      message:
        "관광공사 서버 응답이 지연되어 여행지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

/* -------------------------------------------------------
   2) 관광지 상세 정보 (detailCommon2는 여기서 '1회'만)
------------------------------------------------------- */
router.get("/detail", async (req, res) => {
  const {
    contentId,
    contentTypeId,
    title: fallbackTitle,
    address: fallbackAddress,
    tel: fallbackTel,
  } = req.query;

  if (!contentId) return res.status(400).json({ error: "contentId 필요" });
  if (!contentTypeId) return res.status(400).json({ error: "contentTypeId 필요" });

  const cacheKey = ["detail:v2", contentId, contentTypeId].join("|");
  const cached = getCache(cacheKey);
  if (cached) {
    res.setHeader("X-From-Cache", "1");
    return res.json(cached);
  }

  // ✅ quota 락 상태면 TourAPI를 아예 호출하지 않고, 네이버 기반 fallback만
  if (isQuotaBlocked()) {
    let tel = fallbackTel || "";
    let tags = [];
    try {
      if (fallbackTitle || fallbackAddress) {
        const extra = await enhanceWithNaverLocal(fallbackTitle || "", fallbackAddress || "");
        if (!tel && extra.tel) tel = extra.tel;
        if (extra.category) tags = buildTagsFromCategory(extra.category, contentTypeId);
      }
    } catch {}

    const fastFallback = makeDetailFallback({
      contentId,
      contentTypeId,
      title: fallbackTitle,
      address: fallbackAddress,
      tel,
      tags,
      error: "TOUR_API_QUOTA_BLOCKED",
      message: "현재 TourAPI 호출 한도 초과 상태입니다. 잠시 후 다시 시도해 주세요.",
    });

    setCache(cacheKey, fastFallback, 30 * 1000);
    return res.json(fastFallback);
  }

  try {
    const params = new URLSearchParams({
      serviceKey: TOUR_API_KEY,
      MobileOS: "ETC",
      MobileApp: "TripDiner",
      _type: "json",
      contentId: String(contentId),
      contentTypeId: String(contentTypeId),
      defaultYN: "Y",
      overviewYN: "Y",
      addrinfoYN: "Y",
      imageYN: "Y",
      mapinfoYN: "Y",
    });

    const commonUrl = `https://apis.data.go.kr/B551011/KorService2/detailCommon2?${params.toString()}`;
    const commonJson = await fetchTourJson(commonUrl);

    const info = commonJson?.response?.body?.items?.item?.[0];

    // 상세 없으면 fallback
    if (!info) {
      let tel = fallbackTel || "";
      let tags = [];
      try {
        const extra = await enhanceWithNaverLocal(fallbackTitle || "", fallbackAddress || "");
        if (!tel && extra.tel) tel = extra.tel;
        if (extra.category) tags = buildTagsFromCategory(extra.category, contentTypeId);
      } catch {}

      const fallbackResponse = makeDetailFallback({
        contentId,
        contentTypeId,
        title: fallbackTitle,
        address: fallbackAddress,
        tel,
        tags,
        error: "DETAIL_EMPTY",
        message: "등록된 상세 정보가 없어 기본 정보만 표시합니다.",
      });

      setCache(cacheKey, fallbackResponse, 60 * 1000);
      return res.json(fallbackResponse);
    }

    // 전화/태그 보강 (네이버)
    let tel = (info.tel || fallbackTel || "").trim();
    let tags = [];

    try {
      const extra = await enhanceWithNaverLocal(
        info.title || fallbackTitle || "",
        info.addr1 || fallbackAddress || ""
      );

      if (!tel && extra.tel) tel = extra.tel;
      if (extra.category) tags = buildTagsFromCategory(extra.category, contentTypeId);
      if (!tel || tel === "-" || tel === "없음") tel = "";
    } catch {}

    // 이미지 보강 (한 번만)
    let finalImage = info.firstimage || null;
    try {
      if (!finalImage) {
        const enhancedImg = await enhanceImage(info.title, info.mapy, info.mapx);
        if (enhancedImg) finalImage = enhancedImg;
      }
    } catch {}

    const responseBody = {
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

    setCache(cacheKey, responseBody, 10 * 60 * 1000);
    return res.json(responseBody);
  } catch (err) {
    console.error("🔥 Place /detail Error:", err.code || err.message, err.raw || "");

    // quota 초과면 즉시 fallback + 짧게 캐시
    if (err.code === "TOUR_API_QUOTA_EXCEEDED") {
      let tel = fallbackTel || "";
      let tags = [];

      try {
        const extra = await enhanceWithNaverLocal(fallbackTitle || "", fallbackAddress || "");
        if (!tel && extra.tel) tel = extra.tel;
        if (extra.category) tags = buildTagsFromCategory(extra.category, contentTypeId);
      } catch {}

      const fallbackResponse = makeDetailFallback({
        contentId,
        contentTypeId,
        title: fallbackTitle,
        address: fallbackAddress,
        tel,
        tags,
        error: "TOUR_API_QUOTA",
        message: "TourAPI 호출 한도 초과로 상세 정보를 불러올 수 없습니다. 잠시 후 재시도해 주세요.",
      });

      setCache(cacheKey, fallbackResponse, 60 * 1000);
      return res.json(fallbackResponse);
    }

    // 기타 에러 fallback
    let tel = fallbackTel || "";
    let tags = [];
    try {
      const extra = await enhanceWithNaverLocal(fallbackTitle || "", fallbackAddress || "");
      if (!tel && extra.tel) tel = extra.tel;
      if (extra.category) tags = buildTagsFromCategory(extra.category, contentTypeId);
    } catch {}

    const fallbackResponse = makeDetailFallback({
      contentId,
      contentTypeId,
      title: fallbackTitle,
      address: fallbackAddress,
      tel,
      tags,
      error: err.code || "DETAIL_API_FAILED",
      message: "상세 정보를 불러오는 중 오류가 발생하여 기본 정보만 표시합니다.",
    });

    setCache(cacheKey, fallbackResponse, 60 * 1000);
    return res.json(fallbackResponse);
  }
});

/* -------------------------------------------------------
   3) 좋아요 기능
------------------------------------------------------- */
router.post("/like", async (req, res) => {
  const { contentId, liked, userId, title, address, image, lat, lng, category, cityId } = req.body;

  if (!contentId || !userId) {
    return res.status(400).json({ error: "contentId, userId 필요" });
  }

  let uid, extId;
  try {
    uid = BigInt(userId);
    extId = BigInt(contentId); // ✅ 관광공사 contentid → BigInt로
  } catch {
    return res.status(400).json({ error: "userId/contentId 형식 오류" });
  }

  try {
    // 1) 외부 contentId를 place.external_id로 저장/갱신해서 place_id 확보
    const place = await prisma.place.upsert({
      where: { external_id: extId },
      update: {
        name: title ?? undefined,
        address: address ?? undefined,
        image_url: image ?? undefined,
        lat: lat != null ? Number(lat) : undefined,
        lng: lng != null ? Number(lng) : undefined,
        category: category ?? undefined,
        city_id: cityId ? BigInt(cityId) : undefined,
      },
      create: {
        external_id: extId,
        name: title ?? null,
        address: address ?? null,
        image_url: image ?? null,
        lat: lat != null ? Number(lat) : null,
        lng: lng != null ? Number(lng) : null,
        category: category ?? null,
        city_id: cityId ? BigInt(cityId) : null,
      },
    });

    // 2) 좋아요 on/off
    if (liked) {
      // @@unique([user_id, place_id]) 있어야 upsert 가능
      await prisma.place_like.upsert({
        where: {
          user_id_place_id: { user_id: uid, place_id: place.place_id },
        },
        update: {},
        create: { user_id: uid, place_id: place.place_id },
      });
    } else {
      // 없을 수도 있으니 deleteMany가 안전
      await prisma.place_like.deleteMany({
        where: { user_id: uid, place_id: place.place_id },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("좋아요 저장 오류:", err);
    return res.status(500).json({ error: "Like 저장 실패" });
  }
});

// ✅ 여행지 좋아요 목록 조회 (placeRouter 내부)
router.get("/like/:userId", async (req, res) => {
  const { userId } = req.params;

  let uid;
  try {
    uid = BigInt(userId);
  } catch {
    return res.status(400).json({ error: "잘못된 userId 형식" });
  }

  const result = await prisma.place_like.findMany({
    where: { user_id: uid },
    include: { place: true },
    orderBy: { created_at: "desc" },
  });

  res.json(toJsonSafe(result));
});

export default router;
