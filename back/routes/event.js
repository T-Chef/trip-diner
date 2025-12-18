// back/routes/event.js
import express from "express";
import axios from "axios";
import { load } from "cheerio";
import fetch from "node-fetch";

import { searchPlaceNaver } from "../apis/naverApi.js";

const router = express.Router();

const TOUR_API_KEY = process.env.TOUR_API_KEY || "";
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "";

// =======================================================
// 0) 공통 캐시 / dedupe
// =======================================================
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

// ✅ in-flight dedupe (동일 요청 동시 호출 1번만)
const _inflight = new Map();
const dedup = (key, fn) => {
  if (_inflight.has(key)) return { p: _inflight.get(key), shared: true };

  const p = (async () => {
    try {
      return await fn();
    } finally {
      _inflight.delete(key);
    }
  })();

  _inflight.set(key, p);
  return { p, shared: false };
};

// =======================================================
// 1) 공용 유틸
// =======================================================
const LOG_EVENT = process.env.DEBUG_EVENT_LOG === "1";

const hasQuotaMessage = (raw) =>
  typeof raw === "string" && raw.includes("API token quota exceeded");

const stripHtml = (s = "") => String(s).replace(/<[^>]+>/g, "").trim();

function guessCityName(address = "") {
  const first = String(address).split(" ")[0] || "";
  return first
    .replace("특별시", "")
    .replace("광역시", "")
    .replace("특별자치시", "")
    .replace("특별자치도", "")
    .replace("도", "");
}

function normalizeKeyword(s = "") {
  return String(s)
    .replace(/<[^>]+>/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeCityDup(keyword = "", cityName = "") {
  const k = String(keyword || "").trim();
  const c = String(cityName || "").trim();
  if (!c) return k;
  const re = new RegExp(`^${c}\\s+`, "i");
  return k.replace(re, "").trim();
}

function pickPlaceHintFromAddress(address = "", cityName = "") {
  const parts = String(address).split(/\s+/).filter(Boolean);
  const hint =
    parts.find((p) =>
      /(해수욕장|공원|광장|대교|시장|역|항|터미널|로|길|동|리)$/u.test(p)
    ) ||
    parts[2] ||
    parts[1] ||
    "";

  const h = normalizeKeyword(hint);
  if (!h) return "";
  return removeCityDup(h, cityName);
}

const buildFallbackOverview = ({ title, address, category }) => {
  const t = stripHtml(title);
  const a = stripHtml(address);
  const c = stripHtml(category);
  if (a && t && c) return `${a}에서 열리는 ${t} (${c}) 행사입니다.`;
  if (a && t) return `${a}에서 열리는 ${t} 행사입니다.`;
  if (t) return `${t} 행사 정보입니다.`;
  return "이벤트 소개 정보가 아직 준비되지 않았습니다.";
};

const isWeakOverview = (overview = "") => {
  const s = String(overview || "").trim();
  if (!s) return true;

  const weakSignals = [
    "등록된 소개",
    "overview",
    "호출 한도",
    "상세 정보를",
    "불러오는 중 오류",
    "fallback",
    "준비되지 않았습니다",
  ];
  return weakSignals.some((w) => s.includes(w));
};

const formatDate = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
};

// ✅ TourAPI serviceKey 이중 인코딩 방지
const buildTourUrl = (baseUrl, paramsObj) => {
  const params = new URLSearchParams(paramsObj);
  params.delete("serviceKey");

  const key =
    TOUR_API_KEY.includes("%") ? TOUR_API_KEY : encodeURIComponent(TOUR_API_KEY);

  const qs = params.toString();
  return `${baseUrl}?serviceKey=${key}${qs ? `&${qs}` : ""}`;
};

// =======================================================
// 2) 웹문서(문화포털/공식/지자체 등)에서 overview 가져오기
// =======================================================
async function searchWebNaver(query) {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return [];

  const url = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(
    query
  )}&display=5&sort=sim`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": id,
      "X-Naver-Client-Secret": secret,
    },
  });

  const text = await res.text();
  if (!text.startsWith("{")) return [];

  const data = JSON.parse(text);
  return Array.isArray(data.items) ? data.items : [];
}

// ✅ “본문만” 남기도록 잡음 제거 (메뉴/공유/JS코드 제거)
function cleanScrapedText(raw = "") {
  const s = String(raw || "");

  const lines = s
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const dropContains = [
    "SNS 공유",
    "페이스북",
    "트위터",
    "카카오톡",
    "주소 복사",
    "점자",
    "화면 프린트",
    "스크랩",
    "document.addEventListener",
    "onload = function",
    "window.print",
    "$(",
    "var ",
    "function(",
    "eval(",
    "try {",
    "catch(",
  ];

  const filtered = lines.filter((l) => {
    if (l.length <= 1) return false;
    if (dropContains.some((w) => l.includes(w))) return false;
    // JS/코드처럼 보이는 라인 제거
    if (/[{};=<>]/.test(l) && /function|document|window|\$\(|var|const|let/.test(l))
      return false;
    return true;
  });

  // 너무 길면 앞부분 위주로 자르기
  let out = filtered.join("\n").trim();
  if (out.length > 1200) out = out.slice(0, 1200) + "…";
  return out;
}

// ✅ URL별 본문 추출 (culture.go.kr 전용 처리 포함)
async function scrapeMainText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });

  const html = await res.text();
  const $ = load(html);

  // 스크립트/스타일 제거
  $("script, style, noscript").remove();

  // ✅ 문화포털 oneeye 전용: 본문 후보 먼저 시도
  if (/culture\.go\.kr\/oneeye\/oneEyeView\.do/i.test(url)) {
    const t =
      $("#charactersChange").text().trim() ||
      $(".view_cont").text().trim() ||
      $("article").text().trim();

    const cleaned = cleanScrapedText(t);
    if (cleaned && cleaned.length >= 30) return cleaned;
  }

  // 일반 케이스
  const candidates = [
    "article",
    "#content",
    ".content",
    ".contents",
    ".sub_contents",
    ".board_view",
    ".view",
    ".view_cont",
    ".view_con",
    ".board-view",
    ".post",
    "main",
  ];

  let bestText = "";
  for (const sel of candidates) {
    const t = $(sel).text().replace(/[ \t]+/g, " ").trim();
    if (t.length > bestText.length) bestText = t;
  }

  if (!bestText) bestText = $("body").text().replace(/[ \t]+/g, " ").trim();

  return cleanScrapedText(bestText);
}

// ✅ 네이버 웹문서 결과 중 “축제/행사 소개”에 가까운 링크 고르기
function pickBestWebItem(items, { title = "", city = "" }) {
  const t = normalizeKeyword(title);
  const c = normalizeKeyword(city);

  let best = null;
  let bestScore = -1;

  for (const it of items || []) {
    const link = String(it.link || "");
    const itTitle = normalizeKeyword(it.title || "");
    const desc = normalizeKeyword(it.description || "");

    let score = 0;

    // 도메인 가중치
    if (/culture\.go\.kr/i.test(link)) score += 60; // 문화포털
    if (/visitbusan\.net/i.test(link)) score += 50;
    if (/\.go\.kr/i.test(link)) score += 30;

    // 제목/설명 매칭
    if (t && (itTitle.includes(t) || t.includes(itTitle))) score += 25;
    if (t && desc.includes(t)) score += 10;
    if (c && (itTitle.includes(c) || desc.includes(c))) score += 8;

    // 행사/축제 키워드
    if (/축제|행사|페스티벌|festival|event/i.test(itTitle + " " + desc)) score += 10;

    if (score > bestScore) {
      bestScore = score;
      best = { ...it, _score: score };
    }
  }

  return best;
}

async function getOfficialOverview({ title, address }) {
  const safeTitle = String(title || "").trim();
  const safeAddr = String(address || "").trim();
  if (!safeTitle && safeAddr.length < 2) return null;

  const city = guessCityName(safeAddr);
  const q = `${safeTitle} ${city} 축제 안내`.trim();

  const cacheKey = `official|${q}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { p } = dedup(cacheKey, async () => {
    const items = await searchWebNaver(q);
    const best = pickBestWebItem(items, { title: safeTitle, city });

    if (!best?.link) return null;

    if (LOG_EVENT) {
      console.log("🕸️ WEB pick:", {
        q,
        link: best.link,
        score: best._score,
        title: stripHtml(best.title || ""),
      });
    }

    const text = await scrapeMainText(best.link);
    if (!text || text.length < 30) return null;

    return { url: best.link, text };
  });

  const result = await p;
  if (result) setCache(cacheKey, result, 60 * 60 * 1000);
  return result;
}

// =======================================================
// 3) 네이버 로컬 검색 (후보 확장 + dedupe + best pick)
// =======================================================
function normalizeNaverCoord(v) {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (Math.abs(n) > 1000) return n / 1e7;
  return n;
}

function stripEventWords(s = "") {
  return String(s)
    .replace(
      /(드론|라이트쇼|라이트\s*쇼|쇼|공연|행사|축제|페스티벌|festival|event|개막|개최|시즌|투어|기념|콘서트|전시|박람회|마켓|야시장|불꽃|불꽃놀이)/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function buildLocalSearchCandidates({ title, address, cityName }) {
  const t0 = normalizeKeyword(title);
  const t1 = stripEventWords(t0);
  const aHint = pickPlaceHintFromAddress(address, cityName);

  const candidates = [
    aHint,
    removeCityDup(t1, cityName),
    removeCityDup(t0, cityName),
  ]
    .map((s) => normalizeKeyword(s))
    .filter(Boolean);

  return [...new Set(candidates)];
}

async function naverSearchOnce(title, address) {
  const cityName = guessCityName(address);
  const candidates = buildLocalSearchCandidates({ title, address, cityName });

  if (candidates.length === 0) return [];

  for (const kw of candidates) {
    const cacheKey = ["naver/search", cityName || "all", kw].join("|");

    const cached = getCache(cacheKey);
    if (cached) return cached;

    const { p, shared } = dedup(cacheKey, () => searchPlaceNaver(kw, cityName));
    let list = [];
    try {
      list = await p;
    } catch {
      list = [];
    }

    if (!Array.isArray(list)) list = [];

    if (!shared) {
      console.log("🔍 NAVER 로컬 시도:", { cityName, keyword: kw, len: list.length });
    }

    if (list.length > 0) {
      setCache(cacheKey, list, 10 * 60 * 1000);
      return list;
    }

    setCache(cacheKey, [], 30 * 1000);
  }

  return [];
}

function pickBestNaverItem(items, tourAddress = "", title = "") {
  const addr = String(tourAddress || "");
  const t = normalizeKeyword(title);

  let best = null;
  let bestScore = -1;

  for (const it of items || []) {
    const road = String(it.address || "");
    const tt = normalizeKeyword(it.title || "");

    let score = 0;
    if (road && addr && addr.includes(road)) score += 50;
    if (road && addr && road.includes(addr.split(" ")[0])) score += 10;
    if (t && tt && (t.includes(tt) || tt.includes(t))) score += 20;

    const cat = String(it.category || "");
    if (/해수욕장|관광|명소|공원|광장/.test(cat)) score += 5;

    if (score > bestScore) {
      bestScore = score;
      best = it;
    }
  }

  return best || items?.[0] || null;
}

// =======================================================
// 4) 쿼터/빈상세 fallback
// =======================================================
async function buildEventFallback({
  contentId,
  contentTypeId,
  title,
  address,
  mapX,
  mapY,
  image,
}) {
  let out = {
    contentId,
    contentTypeId,
    title: stripHtml(title) || "이벤트 상세 정보를 불러올 수 없습니다.",
    address: stripHtml(address) || "",
    overview: "",
    homepage: "",
    mapX: mapX || null,
    mapY: mapY || null,
    image: image || null,
    noDetail: true,
    message: "TourAPI 호출 한도 초과/빈상세 상태입니다. (fallback 표시 중)",
  };

  // ✅ 1) 웹문서 우선 (축제는 로컬보다 정확도가 훨씬 좋음)
  try {
    const official = await getOfficialOverview({
      title: out.title || title,
      address: out.address || address,
    });
    if (official?.text) {
      out.overview = official.text;
      out.homepage = official.url || out.homepage;
      out.officialUrl = official.url;
    }
  } catch {}

  // 2) 네이버 로컬로 좌표/홈페이지 보강
  try {
    const list = await naverSearchOnce(out.title || title, out.address || address);
    const best = pickBestNaverItem(list, out.address || address, out.title || title);

    if (best) {
      const link = best.link || best.searchUrl || "";
      if (link && !out.homepage) out.homepage = link;

      const fixedLng = normalizeNaverCoord(best.lng ?? best.mapx);
      const fixedLat = normalizeNaverCoord(best.lat ?? best.mapy);

      if (!out.mapX && fixedLng) out.mapX = fixedLng;
      if (!out.mapY && fixedLat) out.mapY = fixedLat;

      if (!out.address && best.address) out.address = stripHtml(best.address);

      // 웹문서 overview가 없을 때만 로컬 문장 채우기
      if (!out.overview) {
        out.overview = buildFallbackOverview({
          title: out.title || title,
          address: out.address || best.address || "",
          category: best.category || "",
        });
      }
    }
  } catch {}

  if (!out.overview) {
    out.overview = buildFallbackOverview({
      title: out.title || title,
      address: out.address,
      category: "",
    });
  }

  return out;
}

// =======================================================
// 5) 전역 quota 락
// =======================================================
let quotaBlockedUntil = 0;
const isQuotaBlocked = () => Date.now() < quotaBlockedUntil;
const blockQuota = (ms = 60 * 1000) => {
  quotaBlockedUntil = Date.now() + ms;
};

router.use((req, res, next) => {
  if (LOG_EVENT) {
    console.log("NAVER ID?", !!process.env.NAVER_CLIENT_ID);
    console.log("NAVER SECRET?", !!process.env.NAVER_CLIENT_SECRET);
    console.log("GOOGLE KEY?", !!process.env.GOOGLE_API_KEY);
  }
  next();
});

// =======================================================
// 6) 이벤트 목록
// =======================================================
router.get("/list", async (req, res) => {
  const { areaCode, sigunguCode } = req.query;

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
  if (cached) {
    res.setHeader("X-From-Cache", "1");
    return res.json(cached);
  }

  if (isQuotaBlocked()) {
    res.setHeader("X-Quota-Blocked", "1");
    return res.json([]);
  }

  try {
    const baseUrl =
      "https://apis.data.go.kr/B551011/KorService2/searchFestival2";

    const url = buildTourUrl(baseUrl, {
      serviceKey: TOUR_API_KEY,
      MobileOS: "ETC",
      MobileApp: "TripDiner",
      _type: "json",
      numOfRows: "50",
      pageNo: "1",
      eventStartDate,
      eventEndDate,
      ...(areaCode ? { areaCode } : {}),
      ...(sigunguCode ? { sigunguCode } : {}),
    });

    const response = await fetch(url);
    const raw = await response.text();

    if (hasQuotaMessage(raw)) {
      console.error("🔥 Tour API quota exceeded (event list):", raw);
      blockQuota(20 * 60 * 1000);
      res.setHeader("X-TourAPI-Quota", "1");
      return res.json([]);
    }

    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      console.error("🔥 Event list parse error:", raw);
      return res.status(502).json({
        ok: false,
        error: "EVENT_LIST_PARSE_FAILED",
        message: "이벤트 목록 응답을 해석하지 못했습니다.",
      });
    }

    const header = json?.response?.header;
    if (header?.resultCode && header.resultCode !== "0000") {
      return res.status(502).json({
        ok: false,
        error: "TOUR_API_ERROR",
        resultCode: header.resultCode,
        resultMsg: header.resultMsg,
      });
    }

    const items = json?.response?.body?.items?.item || [];
    const events = items.map((i) => ({
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
    }));

    setCache(cacheKey, events, 5 * 60 * 1000);
    return res.json(events);
  } catch (err) {
    console.error("🔥 Event list API Error:", err);
    return res.status(502).json({
      ok: false,
      error: "EVENT_API_FAILED",
      message: "축제/이벤트 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

// =======================================================
// 7) 이벤트 상세
// =======================================================
router.get("/detail", async (req, res) => {
  const { contentId, contentTypeId, title, address, mapX, mapY, image } = req.query;

  if (!contentId || !contentTypeId) {
    return res.status(400).json({ error: "contentId, contentTypeId 필요" });
  }

  const baseKey = ["event/detail", contentId, contentTypeId].join("|");
  const successKey = `${baseKey}|success`;
  const fallbackKey = `${baseKey}|fallback`;

  const successCached = getCache(successKey);
  if (successCached) {
    res.setHeader("X-From-Cache", "1");
    return res.json(successCached);
  }

  const fallbackCached = getCache(fallbackKey);
  if (fallbackCached) {
    res.setHeader("X-From-Cache", "1");
    return res.json(fallbackCached);
  }

  if (isQuotaBlocked()) {
    const fb = await buildEventFallback({ contentId, contentTypeId, title, address, mapX, mapY, image });
    setCache(fallbackKey, fb, 20 * 60 * 1000);
    return res.json(fb);
  }

  try {
    const baseUrl = "https://apis.data.go.kr/B551011/KorService2/detailCommon2";

    const url = buildTourUrl(baseUrl, {
      serviceKey: TOUR_API_KEY,
      MobileOS: "ETC",
      MobileApp: "TripDiner",
      _type: "json",
      contentId,
      contentTypeId,
      defaultYN: "Y",
      overviewYN: "Y",
      firstImageYN: "Y",
      mapinfoYN: "Y",
    });

    if (LOG_EVENT) console.log("Event detail fetch URL:", url);

    const response = await fetch(url);
    const raw = await response.text();

    if (hasQuotaMessage(raw)) {
      console.error("🔥 Tour API quota exceeded (event detail):", raw);
      blockQuota(20 * 60 * 1000);

      const fb = await buildEventFallback({ contentId, contentTypeId, title, address, mapX, mapY, image });
      fb.message = "축제/이벤트 상세 API 호출 한도를 초과했습니다. (fallback 표시 중)";
      setCache(fallbackKey, fb, 20 * 60 * 1000);
      return res.json(fb);
    }

    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      console.error("🔥 Event detail parse error:", raw);
      return res.status(502).json({
        ok: false,
        error: "EVENT_DETAIL_PARSE_FAILED",
        message: "이벤트 상세 응답을 해석하지 못했습니다.",
      });
    }

    const header = json?.response?.header;
    if (header?.resultCode && header.resultCode !== "0000") {
      const fb = await buildEventFallback({ contentId, contentTypeId, title, address, mapX, mapY, image });
      fb.message = `TourAPI 오류(${header.resultCode}): ${header.resultMsg || ""}`.trim();
      setCache(fallbackKey, fb, 20 * 60 * 1000);
      return res.json(fb);
    }

    const item = json?.response?.body?.items?.item;
    const info = Array.isArray(item) ? item[0] : item;

    if (!info) {
      const fb = await buildEventFallback({ contentId, contentTypeId, title, address, mapX, mapY, image });
      fb.message = "상세 정보가 비어 있어 웹문서/네이버 기반으로 보강했습니다.";
      setCache(fallbackKey, fb, 10 * 60 * 1000);
      return res.json(fb);
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

    // ✅ overview가 빈약하면 웹문서로 보강
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

    setCache(successKey, detail, 6 * 60 * 60 * 1000);
    return res.json(detail);
  } catch (err) {
    console.error("🔥 Event detail API Error:", err);
    return res.status(502).json({
      ok: false,
      error: "EVENT_DETAIL_FAILED",
      message: "이벤트 상세 정보를 불러오지 못했습니다.",
    });
  }
});

// =======================================================
// 8) 이벤트 지도/좌표 보강
// =======================================================
router.get("/enrich", async (req, res) => {
  const { title = "", address = "" } = req.query;

  const cacheKey = ["event/enrich", title, address].join("|");
  const cached = getCache(cacheKey);
  if (cached) {
    res.setHeader("X-From-Cache", "1");
    return res.json(cached);
  }

  try {
    let google = null;

    // 1) Google Geocode
    if (address && GOOGLE_API_KEY) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&language=ko&key=${GOOGLE_API_KEY}`;

      const g = await axios.get(geocodeUrl);
      const loc = g.data.results?.[0]?.geometry?.location;
      if (loc) google = { lat: loc.lat, lng: loc.lng };
    }

    // 2) Places TextSearch
    if (!google && GOOGLE_API_KEY) {
      const q = [title, address].filter(Boolean).join(" ");
      const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        q
      )}&language=ko&key=${GOOGLE_API_KEY}`;

      const g = await axios.get(textUrl);
      const p = g.data.results?.[0];
      if (p?.geometry?.location) {
        google = {
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
        };
      }
    }

    // 3) Naver 로컬 (좌표 보강용)
    let naver = null;
    try {
      const list = await naverSearchOnce(title, address);
      const best = pickBestNaverItem(list, address, title);

      if (best) {
        const fixedLng = normalizeNaverCoord(best.lng ?? best.mapx);
        const fixedLat = normalizeNaverCoord(best.lat ?? best.mapy);

        naver = {
          title: best.title,
          address: best.address || null,
          lat: fixedLat,
          lng: fixedLng,
          searchUrl: best.searchUrl || null,
        };
      }
    } catch {}

    const result = {
      title,
      address,
      google: google ?? null,
      naver: naver ?? null,
      lat: google?.lat ?? naver?.lat ?? null,
      lng: google?.lng ?? naver?.lng ?? null,
    };

    setCache(cacheKey, result, 10 * 60 * 1000);
    return res.json(result);
  } catch (e) {
    console.error("🔥 event/enrich error:", e.message || e);
    return res.json({
      title,
      address,
      google: null,
      naver: null,
      lat: null,
      lng: null,
    });
  }
});

export default router;
