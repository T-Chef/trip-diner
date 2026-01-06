import express from "express";
import { getCache, setCache } from "../../utils/cache.js";

import {
  LOG_EVENT,
  formatDate,
  isWeakOverview,
  stripHtml,
} from "../../services/event/eventUtils.js";

import { isQuotaBlocked } from "../../services/tour/quotaGuard.js";
import { fetchEventList, fetchEventDetail } from "../../services/event/eventTourApi.js";

import { buildEventFallback } from "../../services/event/eventFallback.js";
import { getOfficialOverview } from "../../services/event/eventOfficialOverviewService.js";
import { enrichEventLocation } from "../../services/event/eventEnrich.js";

const router = express.Router();

function cacheKeyOf(...parts) {
  return parts.join("|");
}

function respondCached(res, cached) {
  res.setHeader("X-From-Cache", "1");
  return res.json(cached);
}

function respondQuotaBlocked(res, payload = []) {
  res.setHeader("X-Quota-Blocked", "1");
  return res.json(payload);
}

function isTourHandledError(err) {
  return (
    err?.code === "TOUR_API_QUOTA_EXCEEDED" ||
    err?.code === "TOUR_API_ERROR" ||
    err?.code === "TOUR_API_PARSE_FAILED" ||
    err?.code === "TOUR_API_FETCH_FAILED" ||
    err?.code === "TOUR_API_TIMEOUT" ||
    err?.code === "TOUR_API_KEY_MISSING"
  );
}

function setAndReturnJson(res, key, value, ttlMs, headers = {}) {
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, String(v)));
  setCache(key, value, ttlMs);
  return res.json(value);
}

router.use((req, res, next) => {
  if (LOG_EVENT) {
    console.log("NAVER ID?", !!process.env.NAVER_CLIENT_ID);
    console.log("NAVER SECRET?", !!process.env.NAVER_CLIENT_SECRET);
    console.log("GOOGLE KEY?", !!process.env.GOOGLE_API_KEY);
  }
  next();
});

// 1. 이벤트 목록
router.get("/list", async (req, res) => {
  const areaCode = req.query.areaCode;
  const sigunguCode = areaCode ? req.query.sigunguCode : undefined;

  const today = new Date();
  const after30 = new Date();
  after30.setDate(today.getDate() + 30);

  const eventStartDate = formatDate(today);
  const eventEndDate = formatDate(after30);

  const key = cacheKeyOf(
    "event/list",
    areaCode || "all",
    sigunguCode || "all",
    eventStartDate,
    eventEndDate
  );

  const cached = getCache(key);
  if (cached) return respondCached(res, cached);

  if (isQuotaBlocked()) return respondQuotaBlocked(res, []);

  try {
    const events = await fetchEventList({
    areaCode,
    sigunguCode,
    eventStartDate,
    eventEndDate,
  });

    return setAndReturnJson(res, key, events, 5 * 60 * 1000);
  } catch (err) {
    if (err?.code === "TOUR_API_QUOTA_EXCEEDED") {
      res.setHeader("X-TourAPI-Quota", "1");
      return res.json([]);
    }

    console.error("🔥 Event list error:", err?.code || err?.message, err?.raw || "");
    return res.status(502).json({
      ok: false,
      error: err?.code || "EVENT_LIST_FAILED",
      message: "축제/이벤트 목록을 불러오지 못했습니다.",
    });
  }
});

// 2. 이벤트 상세
router.get("/detail", async (req, res) => {
  const { contentId, contentTypeId, title, address, mapX, mapY, image } =
    req.query;

  if (!contentId || !contentTypeId) {
    return res.status(400).json({ error: "contentId, contentTypeId 필요" });
  }

  const baseKey = cacheKeyOf("event/detail", contentId, contentTypeId);
  const successKey = `${baseKey}|success`;
  const fallbackKey = `${baseKey}|fallback`;

  const successCached = getCache(successKey);
  if (successCached) return respondCached(res, successCached);

  const fallbackCached = getCache(fallbackKey);
  if (fallbackCached) return respondCached(res, fallbackCached);

  if (isQuotaBlocked()) {
    const fb = await buildEventFallback({
      contentId,
      contentTypeId,
      title,
      address,
      mapX,
      mapY,
      image,
    });

    return setAndReturnJson(res, fallbackKey, fb, 20 * 60 * 1000, {
      "X-Quota-Blocked": "1",
    });
  }

  try {
    const info = await fetchEventDetail({ contentId, contentTypeId });

    if (!info) {
      const fb = await buildEventFallback({
        contentId,
        contentTypeId,
        title,
        address,
        mapX,
        mapY,
        image,
      });
      fb.message = "상세 정보가 비어 있어 웹문서/네이버 기반으로 보강했습니다.";

      return setAndReturnJson(res, fallbackKey, fb, 10 * 60 * 1000);
    }

    const detail = {
      contentId,
      contentTypeId,
      title: info.title,
      overview: stripHtml(info.overview || ""),
      address: info.addr1,
      homepage: info.homepage,
      mapX: info.mapx,
      mapY: info.mapy,
      image: info.firstimage,
      noDetail: false,
    };

    if (isWeakOverview(detail.overview)) {
      const official = await getOfficialOverview({
        title: detail.title || title,
        address: detail.address || address,
      });

      if (official?.text) {
        detail.overview = official.text;
        if (!detail.homepage) detail.homepage = official.url;
        detail.officialUrl = official.url;
        detail.message = "상세 정보가 비어 있어 웹문서 기반으로 보강했습니다.";
      }
    }

    return setAndReturnJson(res, successKey, detail, 6 * 60 * 60 * 1000);
  } catch (err) {

    if (isTourHandledError(err)) {
      const fb = await buildEventFallback({
        contentId,
        contentTypeId,
        title,
        address,
        mapX,
        mapY,
        image,
      });

      if (err?.code === "TOUR_API_QUOTA_EXCEEDED") {
        fb.message = "축제/이벤트 상세 API 호출 한도를 초과했습니다. (fallback 표시 중)";
        res.setHeader("X-TourAPI-Quota", "1");
      } else if (err?.code === "TOUR_API_ERROR") {
        fb.message = `TourAPI 오류(${err.resultCode || ""}): ${err.resultMsg || ""}`.trim();
      } else {
        fb.message = `상세 정보를 불러오는 중 오류가 발생했습니다. (${err.code})`;
      }

      return setAndReturnJson(res, fallbackKey, fb, 20 * 60 * 1000);
    }

    console.error("🔥 Event detail error:", err);
    return res.status(502).json({
      ok: false,
      error: err?.code || "EVENT_DETAIL_FAILED",
      message: "이벤트 상세 정보를 불러오지 못했습니다.",
    });
  }
});

// 3. 이벤트 위치 보강
router.get("/enrich", async (req, res) => {
  const { title = "", address = "" } = req.query;
  const result = await enrichEventLocation({ title, address });
  return res.json(result);
});

export default router;
