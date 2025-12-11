// 🔥 통합 place.js (관광공사 + AI + Google + Naver 이미지 보강 버전)

import express from "express";
import "dotenv/config";
import axios from "axios";
import { generateDescription } from "../utils/aiDescription.js";

const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

/* -------------------------------------------------------
   아주 간단한 메모리 캐시 (프로세스 단위)
   - key: string
   - value: any
   - ttlMs: 만료 시간(ms)
------------------------------------------------------- */
const _cache = new Map();

function setCache(key, value, ttlMs) {
  const expires = Date.now() + ttlMs;
  _cache.set(key, { value, expires });
}

function getCache(key) {
  const entry = _cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    _cache.delete(key); // 만료된 건 치우기
    return null;
  }
  return entry.value;
}

/* -------------------------------------------------------
   텍스트 정리 함수
------------------------------------------------------- */
const cleanText = (t) => t?.replace(/\n/g, " ").trim() ?? "";

// HTML 제거 + 기본 처리
const cleanOverview = (text) => {
  if (!text || typeof text !== "string") return "";

  const cleaned = text.replace(/<[^>]+>/g, "").trim();
  return cleaned.length === 0 ? "" : cleaned;
};

/* -------------------------------------------------------
   GOOGLE + NAVER 이미지 보강 함수
------------------------------------------------------- */
async function enhanceImage(title, lat, lng) {
  try {
    /* 1) Google Place Details 기반 보강 */
    const googleUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        title
      )}&location=${lat},${lng}&radius=500&type=point_of_interest&language=ko&key=${
        process.env.GOOGLE_API_KEY
      }`;

    const gRes = await axios.get(googleUrl);
    const gPlace = gRes.data.results?.[0];

    if (gPlace?.photos?.length > 0) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${
        gPlace.photos[0].photo_reference
      }&key=${process.env.GOOGLE_API_KEY}`;
    }

    /* 2) NAVER 이미지 보강 */
    const naverRes = await axios.get(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(
        title
      )}&display=1`,
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    const nItem = naverRes.data.items?.[0];
    if (nItem) return nItem.thumbnail || nItem.link;

    return null;
  } catch (err) {
    console.warn("⚠ 이미지 보강 실패:", err.message);
    return null;
  }
}

/* -------------------------------------------------------
   NAVER Local API로 전화번호 보강
------------------------------------------------------- */
async function enhanceWithNaverLocal(title, address) {
  try {
    const query = `${title || ""} ${address || ""}`.trim();
    if (!query) return {};

    const res = await axios.get(
      "https://openapi.naver.com/v1/search/local.json",
      {
        params: {
          query,
          display: 1,
        },
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    const item = res.data.items?.[0];
    if (!item) return {};

    console.log("✅ Naver Local hit:", {
      title: item.title,
      telephone: item.telephone,
      category: item.category,
      roadAddress: item.roadAddress,
    });

    return {
      tel: item.telephone || "",
      roadAddress: item.roadAddress || "",
      category: item.category || "",
    };
  } catch (err) {
    console.warn("⚠ Naver Local 보강 실패:", err.message);
    return {};
  }
}

// 네이버 category → 태그 배열로 변환
function buildTagsFromCategory(category, contentTypeId) {
  const tags = [];

  if (category) {
    const parts = category
      .split(/[>\/,]/)           // "한식 > 국수,면요리" 이런 거 쪼개기
      .map(p => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      if (part.includes("카페")) tags.push("카페");
      else if (part.includes("디저트") || part.includes("빵") || part.includes("베이커리"))
        tags.push("베이커리");
      else if (part.includes("한식")) tags.push("한식");
      else if (part.includes("양식")) tags.push("양식");
      else if (part.includes("중식")) tags.push("중식");
      else if (part.includes("일식")) tags.push("일식");
      else if (!tags.includes(part)) tags.push(part);
    }
  }

  // 그래도 아무것도 없으면 contentTypeId 기준으로 대략
  if (tags.length === 0 && contentTypeId) {
    const type = String(contentTypeId);
    if (type === "39") tags.push("음식점");
    else if (type === "12") tags.push("관광지");
    else if (type === "32") tags.push("숙박");
  }

  // 중복 제거 + 최대 3개까지만
  return [...new Set(tags)].slice(0, 3);
}


/* -------------------------------------------------------
   관광지 목록 조회 (통합 버전)
   GET /api/place/places?areaCode=6&sigunguCode=8&keyword=부산
------------------------------------------------------- */
router.get("/places", async (req, res) => {
  const { areaCode, sigunguCode, contentTypeId, keyword } = req.query;
  if (!areaCode) return res.status(400).json({ error: "areaCode 필요" });

  try {

    // ✅ 1) 캐시 키 만들기
    const cacheKey = [
      "places",
      areaCode,
      sigunguCode || "",
      contentTypeId || "",
      (keyword || "").trim()
    ].join("|");

    // ✅ 2) 캐시 히트면 바로 리턴
    const cached = getCache(cacheKey);

    if (cached) {
      // console.log("[CACHE HIT] /places", cacheKey);
      return res.json(cached);
    }

    const encodedKey = encodeURIComponent(TOUR_API_KEY);

    let url =
      `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&_type=json&numOfRows=200&pageNo=1` +
      `&areaCode=${areaCode}`;

    if (sigunguCode) url += `&sigunguCode=${sigunguCode}`;
    if (contentTypeId) url += `&contentTypeId=${contentTypeId}`;

    const response = await fetch(url);
    const data = await response.json();
    const items = data?.response?.body?.items?.item || [];

    /* -------------------------
       상세 개별 overview 조회
    ------------------------- */
    const fetchOverview = async (contentId, typeId) => {
      try {
        const detailUrl =
          `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodedKey}` +
          `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
          `&contentId=${contentId}&contentTypeId=${typeId}` +
          `&overviewYN=Y&defaultYN=Y`;

        const res = await fetch(detailUrl);
        const json = await res.json();
        return json?.response?.body?.items?.item?.[0]?.overview || null;
      } catch {
        return null;
      }
    };

    /* -------------------------
       목록 + overview + 이미지 보강
    ------------------------- */
    const result = await Promise.all(
      items.map(async (i, idx) => {
        const contentId = i.contentid;
        const typeId = i.contenttypeid;

        // 1) 관광공사 overview
        let overviewRaw = await fetchOverview(i.contentid, typeId)
        let overview = cleanOverview(overviewRaw);

        // 2) overview 없을 시 AI 생성 (상위 20개만)
        if (!overview && idx < 20) {
          const safeAddress = cleanText(i.addr1);
          const aiText = await generateDescription(i.title, safeAddress);

          if (aiText && aiText.trim().length > 0) {
            overview = aiText.trim();
          }
        }

        // ✅ 3) 이미지 보강 로직 수정
        //    - 먼저 관광공사 firstimage 사용
        //    - 없을 때만 외부 API를 제한적으로 사용
        let finalImage = i.firstimage || null;

        if (!finalImage && idx < 20) {
          const enhancedImg = await enhanceImage(i.title, i.mapy, i.mapx);
          if (enhancedImg) finalImage = enhancedImg;
        }

        return {
          contentId,
          contentTypeId: typeId,
          title: i.title,
          address: i.addr1,
          tel: i.tel,
          latitude: i.mapy,
          longitude: i.mapx,
          image: finalImage, 
          overview,
        };
      })
    );

    /* -------------------------
       keyword 검색 필터링
    ------------------------- */
    let filtered = result;
    if (keyword) {
      const kw = keyword.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const t = p.title?.toLowerCase() || "";
        const a = p.address?.toLowerCase() || "";
        const o = p.overview?.toLowerCase() || "";
        return t.includes(kw) || a.includes(kw) || o.includes(kw);
      });
    }

    setCache(cacheKey, filtered, 5 * 60 * 1000);
    res.json(filtered);

  } catch (err) {
    console.error("🔥 Place API Error:", err);

    // ✅ 외부 API 터졌지만, 예전 캐시라도 있으면 그거 보여주기
    if (cached) {
      console.warn("⚠ 외부 API 에러 발생, 캐시 데이터로 대체:", cacheKey);
     // ✨ 프론트가 알 수 있게 감싸서 내려주기
      return res.json({
        ok: true,
        fromCache: true,
        message: "실시간 데이터 호출이 실패하여, 저장된 목록을 대신 보여드려요.",
        data: cached,
      });
    }

    // ✨ 완전 실패일 때는 사용자용 메시지 + 코드
    return res.status(502).json({
      ok: false,
      error: "TOUR_API_FAILED",
      code: err.cause?.code || err.code || null,
      message:
        "관광공사 서버 응답이 지연되어 여행지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
    });
  }
});

/* -------------------------------------------------------
   관광지 상세 정보  + detailIntro2 로 전화번호/편의시설 보강
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

  try {
    
    const cacheKey = ["detail", contentId, contentTypeId].join("|");

    const cached = getCache(cacheKey);

    if (cached) {
      // console.log("[CACHE HIT] /detail", cacheKey);
      return res.json(cached);
    }

    const encodedKey = encodeURIComponent(TOUR_API_KEY);

    /* 1) detailCommon2 : 기본 주소/개요/좌표/이미지 */
    const commonUrl =
      `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
      `&contentId=${contentId}&contentTypeId=${contentTypeId}` +
      `&defaultYN=Y&overviewYN=Y&addrinfoYN=Y&imageYN=Y&mapinfoYN=Y`;

    const commonRes = await fetch(commonUrl);
    const commonRaw = await commonRes.text();  

    let commonJson;
    try {
      commonJson = JSON.parse(commonRaw);
    } catch (parseErr) {
      console.error("🔥 DetailCommon Raw response (not JSON):", commonRaw);
      
       // 관광공사 응답이 이상해도, 네이버 Local로 최대한 보강
      let tel = fallbackTel || "";
      let tags = [];

      if (fallbackTitle || fallbackAddress) {
        const extra = await enhanceWithNaverLocal(
          fallbackTitle || "",
          fallbackAddress || ""
        );
        tel = extra.tel || tel;
        tags = buildTagsFromCategory(extra.category || "", contentTypeId);
      }

      const fallbackResponse = {
        contentId,
        contentTypeId,
        title: fallbackTitle || "상세 정보를 불러오지 못했습니다.", // 또는 "상세 정보 없음"
        address: fallbackAddress || "",
        tel,
        overview: "",
        homepage: "",
        mapX: null,
        mapY: null,
        image: null,
        tags,
        noDetail: true,
        error: "DETAIL_PARSE_ERROR",
        message: "상세 정보를 불러오는 중 오류가 발생하여 기본 정보만 표시합니다.",
      };

      // ✅ 에러 응답도 짧게 캐싱 (1분)
      setCache(cacheKey, fallbackResponse, 60 * 1000);

      return res.json(fallbackResponse);
    }

    const info = commonJson?.response?.body?.items?.item?.[0];

    /* 🔹 2-A) 아예 상세가 없을 때 (info undefined) */
if (!info) {
  let tel = fallbackTel || "";
  let tags = [];

  try {
    if (fallbackTitle || fallbackAddress) {
      const extra = await enhanceWithNaverLocal(
        fallbackTitle || "",
        fallbackAddress || ""
      );
      if (extra.tel) {
        tel = extra.tel;
      }
      if (extra.category) {
        tags = buildTagsFromCategory(extra.category, contentTypeId);
      }
    }
  } catch (e) {
    console.warn("⚠ Naver Local fallback 실패:", e.message);
  }

  const fallbackResponse = {
    contentId,
    contentTypeId,
    title: fallbackTitle || "상세 정보를 불러오지 못했습니다.", // 또는 "상세 정보 없음"
    address: fallbackAddress || "",
    tel,
    overview: "",
    homepage: "",
    mapX: null,
    mapY: null,
    image: null,
    tags,
    noDetail: true,
    error: "DETAIL_EMPTY",
    message: "등록된 상세 정보가 없어 목록의 기본 정보만 표시합니다.",
  };

  // ❗ 여기도 캐시해두면 같은 에러 계속 안 나게됨
  const cacheKey = ["detail", contentId, contentTypeId].join("|");
  setCache(cacheKey, fallbackResponse, 60 * 1000);

  return res.json(fallbackResponse);
}

    /* 2) 기본 전화번호 " detailCOmmon + 목록 fallback" */
    let tel = (info.tel || fallbackTel || "").trim();
    let tags = [];

    // 4) detailIntro2로 편의시설 + 안내전화 보강
    try {
      const introUrl =
        `https://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${encodedKey}` +
        `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
        `&contentId=${contentId}&contentTypeId=${contentTypeId}`;

      const introRes = await fetch(introUrl);
      const introRaw = await introRes.text();

      let introJson;
      try {
        introJson = JSON.parse(introRaw);
      } catch (e) {
        console.error("🔥 DetailIntro Raw response (not JSON):", introRaw);
      }

      const intro = introJson?.response?.body?.items?.item?.[0];

      if (intro) {
        console.log("[DETAIL_INTRO_RAW]", contentId, {
          infocenterfood: intro.infocenterfood,
          infocentertour: intro.infocentertour,
        });

        // 🔸 안내전화
        tel =
          intro.infocenterfood ||     // 음식점
          intro.infocentertour ||     // 관광지
          intro.infocenterleports ||  // 레포츠
          intro.infocenter ||         // 기타
          tel;
      }
    } catch (e) {
      console.warn("⚠ detailIntro 불러오기 실패:", e.message);
    }

  /* 5) 네이버 Local 로 전화번호 + 태그 보강 */
   try {
      const extra = await enhanceWithNaverLocal(
        info.title || fallbackTitle || "",
        info.addr1 || fallbackAddress || ""
      );

      if (extra.tel && !tel) {
        tel = extra.tel;
      }

      if (extra.category) {
        tags = buildTagsFromCategory(extra.category, contentTypeId);
      }
      if (!tel || tel === "-" || tel === "없음") {
        tel = "";
      }
    } catch (e) {
      console.warn("⚠ Naver Local 태그 보강 실패:", e.message);
    }

    /* 6) 이미지 보강 (Google / Naver) */
    let finalImage = info.firstimage || null;

    try {
      const enhancedImg = await enhanceImage(info.title, info.mapy, info.mapx);
      if (enhancedImg) finalImage = enhancedImg;
    } catch (e) {
      console.warn("⚠ 이미지 보강 실패(detail):", e.message);
    }

    console.log("[DETAIL_RESULT]", contentId, {
      tel,
      tags,
    });

    /* 7) 최종 응답 만들기 */
    const responseBody = {
      contentId,
      contentTypeId,
      title: info.title,
      address: info.addr1,
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

    // ✅ 정상 응답은 조금 길게 캐싱 (예: 10분)
    setCache(cacheKey, responseBody, 10 * 60 * 1000);
  
    return res.json(responseBody);

  } catch (err) {
    console.error("🔥 Detail API Error:", err);

    // 🔁 관광공사 통신 실패 시에도 최대한 fallback 응답 보내기
  let tel = fallbackTel || "";
  let tags = [];

  try {
    if (fallbackTitle || fallbackAddress) {
      const extra = await enhanceWithNaverLocal(
        fallbackTitle || "",
        fallbackAddress || ""
      );
      if (extra.tel) {
        tel = extra.tel;
      }
      if (extra.category) {
        tags = buildTagsFromCategory(extra.category, contentTypeId);
      }
    }
  } catch (e) {
    console.warn("⚠ fallback Naver Local 도 실패:", e.message);
  }

  const fallbackResponse = {
      contentId,
      contentTypeId,
      title: fallbackTitle || "상세 정보를 불러오지 못했습니다.", // 또는 "상세 정보 없음"
      address: fallbackAddress || "",
      tel,
      overview: "",
      homepage: "",
      mapX: null,
      mapY: null,
      image: null,
      tags,
      noDetail: true,
      error: "DETAIL_API_FAILED",
      message:
      "상세 API 호출 중 오류가 발생하여, 기본 정보만 표시합니다. 전화번호 등 일부 정보가 없을 수 있어요.",
    };

    // ✅ 에러 응답도 1분 정도 캐싱
    const cacheKey = ["detail", contentId, contentTypeId].join("|");
    setCache(cacheKey, fallbackResponse, 60 * 1000);

    return res.json(fallbackResponse);
  }
});

/* -------------------------------------------------------
   좋아요 기능
------------------------------------------------------- */
router.post("/like", async (req, res) => {
  const { contentId, liked, userId } = req.body;

  if (!contentId || !userId) {
    return res.status(400).json({ error: "contentId, userId 필요" });
  }

  try {
    if (liked) {
      await db.query(
        "INSERT INTO likes (user_id, content_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id=user_id",
        [userId, contentId]
      );
    } else {
      await db.query(
        "DELETE FROM likes WHERE user_id=? AND content_id=?",
        [userId, contentId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("좋아요 저장 오류:", err);
    res.status(500).json({ error: "Like 저장 실패" });
  }
});

export default router;
