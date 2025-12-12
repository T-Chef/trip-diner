// back/routes/place.js
import express from "express";
import "dotenv/config";
import { generateDescription } from "../utils/aiDescription.js";
import { setCache, getCache } from "../utils/cache.js";
import { cleanText, cleanOverview, buildTagsFromCategory } from "../utils/textUtils.js";
import { enhanceWithNaverLocal } from "../services/naverService.js";
import { enhanceImage } from "../services/imageService.js";
// ⚠ db import 잊지 말기
// import db from "../db/index.js";

const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

/* 공통: 상세 fallback 응답 생성 헬퍼 */
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

/* -------------------------------------------------------
   1) 관광지 목록 조회
------------------------------------------------------- */
router.get("/places", async (req, res) => {
  const { areaCode, sigunguCode, contentTypeId, keyword } = req.query;
  if (!areaCode) return res.status(400).json({ error: "areaCode 필요" });

  const cacheKey = [
    "places",
    areaCode,
    sigunguCode || "",
    contentTypeId || "",
    (keyword || "").trim(),
  ].join("|");

  const cached = getCache(cacheKey);

  try {
    if (cached) {
      console.log("[CACHE HIT] /places", cacheKey);
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

    // 개별 상세 overview 조회 함수
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

    const result = await Promise.all(
      items.map(async (i, idx) => {
        const contentId = i.contentid;
        const typeId = i.contenttypeid;

        // 1) 관광공사 overview
        const overviewRaw = await fetchOverview(contentId, typeId);
        let overview = cleanOverview(overviewRaw);

        // 2) overview 없으면 AI 생성 (상위 20개)
        if (!overview && idx < 20) {
          const safeAddress = cleanText(i.addr1);
          const aiText = await generateDescription(i.title, safeAddress);
          if (aiText && aiText.trim().length > 0) {
            overview = aiText.trim();
          }
        }

        // 3) 그래도 없으면 주소 + 이름 한 줄
        if (!overview) {
          const addr = cleanText(i.addr1);
          const title = i.title || "";
          if (addr && title) {
            overview = `${addr}에 위치한 "${title}" 장소입니다.`;
          } else if (title) {
            overview = `"${title}"에 대한 소개가 아직 준비 중인 장소입니다.`;
          } else {
            overview = "이 장소에 대한 소개가 아직 준비 중입니다.";
          }
        }

        // 4) 이미지 보강
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

    // keyword 필터링
    let filtered = result;
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const t = p.title?.toLowerCase() || "";
        const a = p.address?.toLowerCase() || "";
        const o = p.overview?.toLowerCase() || "";
        return t.includes(kw) || a.includes(kw) || o.includes(kw);
      });
    }

    setCache(cacheKey, filtered, 5 * 60 * 1000);
    return res.json(filtered);
  } catch (err) {
    console.error("🔥 Place API Error:", err);

    if (cached) {
      console.warn("⚠ 외부 API 에러 발생, 캐시 데이터로 대체:", cacheKey);
      res.setHeader("X-From-Cache", "1");   // 필요하면 헤더로만 표시
      return res.json(cached);
    }

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
   2) 관광지 상세 정보
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

  const cacheKey = ["detail", contentId, contentTypeId].join("|");
  const cached = getCache(cacheKey);

  try {
    if (cached) {
      return res.json(cached);
    }

    const encodedKey = encodeURIComponent(TOUR_API_KEY);

    // detailCommon2
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

      const fallbackResponse = makeDetailFallback({
        contentId,
        contentTypeId,
        title: fallbackTitle,
        address: fallbackAddress,
        tel,
        tags,
        error: "DETAIL_PARSE_ERROR",
        message: "상세 정보를 불러오는 중 오류가 발생하여 기본 정보만 표시합니다.",
      });

      setCache(cacheKey, fallbackResponse, 60 * 1000);
      return res.json(fallbackResponse);
    }

    const info = commonJson?.response?.body?.items?.item?.[0];

    // 상세가 아예 없을 때
    if (!info) {
      let tel = fallbackTel || "";
      let tags = [];

      try {
        if (fallbackTitle || fallbackAddress) {
          const extra = await enhanceWithNaverLocal(
            fallbackTitle || "",
            fallbackAddress || ""
          );
          if (extra.tel) tel = extra.tel;
          if (extra.category)
            tags = buildTagsFromCategory(extra.category, contentTypeId);
        }
      } catch (e) {
        console.warn("⚠ Naver Local fallback 실패:", e.message);
      }

      const fallbackResponse = makeDetailFallback({
        contentId,
        contentTypeId,
        title: fallbackTitle,
        address: fallbackAddress,
        tel,
        tags,
        error: "DETAIL_EMPTY",
        message: "등록된 상세 정보가 없어 목록의 기본 정보만 표시합니다.",
      });

      setCache(cacheKey, fallbackResponse, 60 * 1000);
      return res.json(fallbackResponse);
    }

    // 기본 전화번호
    let tel = (info.tel || fallbackTel || "").trim();
    let tags = [];

    // detailIntro2 로 안내전화 보강
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
        tel =
          intro.infocenterfood ||
          intro.infocentertour ||
          intro.infocenterleports ||
          intro.infocenter ||
          tel;
      }
    } catch (e) {
      console.warn("⚠ detailIntro 불러오기 실패:", e.message);
    }

    // Naver Local 로 전화번호 + 태그 보강
    try {
      const extra = await enhanceWithNaverLocal(
        info.title || fallbackTitle || "",
        info.addr1 || fallbackAddress || ""
      );

      if (extra.tel && !tel) tel = extra.tel;
      if (extra.category) {
        tags = buildTagsFromCategory(extra.category, contentTypeId);
      }

      if (!tel || tel === "-" || tel === "없음") {
        tel = "";
      }
    } catch (e) {
      console.warn("⚠ Naver Local 태그 보강 실패:", e.message);
    }

    // 이미지 보강
    let finalImage = info.firstimage || null;
    try {
      const enhancedImg = await enhanceImage(info.title, info.mapy, info.mapx);
      if (enhancedImg) finalImage = enhancedImg;
    } catch (e) {
      console.warn("⚠ 이미지 보강 실패(detail):", e.message);
    }

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

    setCache(cacheKey, responseBody, 10 * 60 * 1000);
    return res.json(responseBody);
  } catch (err) {
    console.error("🔥 Detail API Error:", err);

    let tel = fallbackTel || "";
    let tags = [];

    try {
      if (fallbackTitle || fallbackAddress) {
        const extra = await enhanceWithNaverLocal(
          fallbackTitle || "",
          fallbackAddress || ""
        );
        if (extra.tel) tel = extra.tel;
        if (extra.category)
          tags = buildTagsFromCategory(extra.category, contentTypeId);
      }
    } catch (e) {
      console.warn("⚠ fallback Naver Local 도 실패:", e.message);
    }

    const fallbackResponse = makeDetailFallback({
      contentId,
      contentTypeId,
      title: fallbackTitle,
      address: fallbackAddress,
      tel,
      tags,
      error: "DETAIL_API_FAILED",
      message:
        "상세 API 호출 중 오류가 발생하여, 기본 정보만 표시합니다. 전화번호 등 일부 정보가 없을 수 있어요.",
    });

    setCache(cacheKey, fallbackResponse, 60 * 1000);
    return res.json(fallbackResponse);
  }
});

/* -------------------------------------------------------
   3) 좋아요 기능
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
