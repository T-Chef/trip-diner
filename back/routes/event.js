// back/routes/event.js
import express from "express";
import "dotenv/config";

const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

// 간단 메모리 캐시
const _cache = new Map();
const setCache = (k, v, ttlMs) => _cache.set(k, { v, exp: Date.now() + ttlMs });
const getCache = (k) => {
  const e = _cache.get(k);
  if (!e) return null;
  if (Date.now() > e.exp) {
    _cache.delete(k);
    return null;
  }
  return e.v;
};

// yyyyMMdd 포맷
const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

/* ----------------------------------------------
   1) 이벤트 목록
   GET /api/event/list?areaCode=6&sigunguCode=8
   - 기본: 오늘 ~ +30일 사이 진행/예정 이벤트
---------------------------------------------- */
router.get("/list", async (req, res) => {
  const { areaCode, sigunguCode } = req.query;

  // 날짜 기본값: 오늘 ~ 30일 후
  const today = new Date();
  const after30 = new Date();
  after30.setDate(today.getDate() + 30);

  const eventStartDate = formatDate(today);
  const eventEndDate = formatDate(after30);

  const cacheKey = [
    "event/list",
    areaCode || "all",
    sigunguCode || "all",
    eventStartDate,
    eventEndDate,
  ].join("|");

  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const encodedKey = encodeURIComponent(TOUR_API_KEY);

    let url =
      `https://apis.data.go.kr/B551011/KorService2/searchFestival2` +
      `?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
      `&numOfRows=50&pageNo=1` +
      `&eventStartDate=${eventStartDate}` +
      `&eventEndDate=${eventEndDate}`;

    if (areaCode) url += `&areaCode=${areaCode}`;
    if (sigunguCode) url += `&sigunguCode=${sigunguCode}`;

    const response = await fetch(url);
    const json = await response.json();
    const items = json?.response?.body?.items?.item || [];

    // 필요한 정보만 뽑아서 정리
    const events = items.map((i) => ({
      contentId: i.contentid,
      contentTypeId: i.contenttypeid, // 상세 호출용
      title: i.title,
      address: i.addr1,
      image: i.firstimage,
      startDate: i.eventstartdate,   // "20250101"
      endDate: i.eventenddate,       // "20250103"
      tel: i.tel,
    }));

    // 간단 캐시 (5분)
    setCache(cacheKey, events, 5 * 60 * 1000);

    res.json(events);
  } catch (err) {
    console.error("🔥 Event list API Error:", err);
    res.status(502).json({
      ok: false,
      error: "EVENT_API_FAILED",
      message: "축제/이벤트 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

/* ----------------------------------------------
   2) 이벤트 상세 뼈대
   GET /api/event/detail?contentId=123&contentTypeId=15
---------------------------------------------- */
router.get("/detail", async (req, res) => {
  const { contentId, contentTypeId } = req.query;

  if (!contentId || !contentTypeId) {
    return res.status(400).json({ error: "contentId, contentTypeId 필요" });
  }

  const cacheKey = ["event/detail", contentId, contentTypeId].join("|");
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const encodedKey = encodeURIComponent(TOUR_API_KEY);

    const url =
      `https://apis.data.go.kr/B551011/KorService2/detailCommon2` +
      `?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
      `&contentId=${contentId}&contentTypeId=${contentTypeId}` +
      `&defaultYN=Y&overviewYN=Y&addrinfoYN=Y&imageYN=Y&mapinfoYN=Y`;
    
    console.log("Event detail fetch URL:", url);

    const response = await fetch(url);
    const raw = await response.text();

    // 쿼터 초과 체크
    if (raw.includes("API token quota exceeded")) {
      console.error("🔥 Tour API quota exceeded:", raw);

      return res.status(429).json({
        ok: false,
        error: "TOUR_API_QUOTA",
        message:
          "한국관광공사 API 호출 한도를 초과했습니다. 잠시 후 다시 시도하거나, 새로운 인증키로 설정해 주세요.",
      });
    }

    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.error("🔥 Event detail parse error:", raw);
      return res.status(502).json({
    ok: false,
    error: "EVENT_DETAIL_PARSE_FAILED",
    message: "이벤트 상세 응답을 해석하지 못했습니다.",
      });
    }

    const info = json?.response?.body?.items?.item?.[0];

    if (!info) {
      return res.json({
        contentId,
        contentTypeId,
        title: "등록된 상세 정보가 없습니다.",
        overview: "",
        address: "",
        homepage: "",
        mapX: null,
        mapY: null,
        image: null,
        noDetail: true,
      });
    }

    const detail = {
      contentId,
      contentTypeId,
      title: info.title,
      overview: (info.overview || "").replace(/<[^>]+>/g, "").trim(),
      address: info.addr1,
      homepage: info.homepage,
      mapX: info.mapx,
      mapY: info.mapy,
      image: info.firstimage,
      noDetail: false,
    };

    setCache(cacheKey, detail, 10 * 60 * 1000);
    res.json(detail);
  } catch (err) {
    console.error("🔥 Event detail API Error:", err);
    res.status(502).json({
      ok: false,
      error: "EVENT_DETAIL_FAILED",
      message: "이벤트 상세 정보를 불러오지 못했습니다.",
    });
  }
});

export default router;
