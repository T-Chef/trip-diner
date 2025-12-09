// 🔥 통합 place.js (관광공사 + AI + Google + Naver 이미지 보강 버전)

import express from "express";
import "dotenv/config";
import axios from "axios";
import { generateDescription } from "../utils/aiDescription.js";

const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

/* -------------------------------------------------------
   텍스트 정리 함수
------------------------------------------------------- */
const cleanText = (t) => t?.replace(/\n/g, " ").trim() ?? "";

// HTML 제거 + 기본 처리
const cleanOverview = (text) => {
  if (!text || typeof text !== "string") return "설명 없음";

  const cleaned = text.replace(/<[^>]+>/g, "").trim();
  return cleaned.length === 0 ? "설명 없음" : cleaned;
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
   관광지 목록 조회 (통합 버전)
   GET /api/place/places?areaCode=6&sigunguCode=8&keyword=부산
------------------------------------------------------- */
router.get("/places", async (req, res) => {
  const { areaCode, sigunguCode, contentTypeId, keyword } = req.query;
  if (!areaCode) return res.status(400).json({ error: "areaCode 필요" });

  try {
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
      items.map(async (i) => {
        const contentId = i.contentid;
        const typeId = i.contenttypeid;

        // 1) 관광공사 overview
        let ovRaw = await fetchOverview(contentId, typeId);
        let overview = cleanOverview(ovRaw);

        // 2) overview 없을 시 AI 생성
        if (overview === "설명 없음") {
          overview = await generateDescription(i.title, cleanText(i.addr1));
        }

        // 3) 이미지 보강 (Google → Naver → 관광공사)
        const enhancedImg = await enhanceImage(i.title, i.mapy, i.mapx);
        const finalImage = enhancedImg || i.firstimage || null;

        return {
          contentId,
          contentTypeId: typeId,
          title: i.title,
          address: i.addr1,
          tel: i.tel,
          latitude: i.mapy,
          longitude: i.mapx,
          image: finalImage, // 🔥 Google/Naver 보강된 이미지
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
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(kw) ||
          p.address?.toLowerCase().includes(kw) ||
          p.overview?.toLowerCase().includes(kw)
      );
    }

    res.json(filtered);
  } catch (err) {
    console.error("🔥 Place API Error:", err);
    res.status(500).json({ error: "Tour API place error", detail: err.message });
  }
});

/* -------------------------------------------------------
   관광지 상세 정보
------------------------------------------------------- */
router.get("/place/detail", async (req, res) => {
  const { contentId, contentTypeId } = req.query;

  if (!contentId) return res.status(400).json({ error: "contentId 필요" });
  if (!contentTypeId) return res.status(400).json({ error: "contentTypeId 필요" });

  try {
    const encodedKey = encodeURIComponent(TOUR_API_KEY);

    const url =
      `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
      `&contentId=${contentId}&contentTypeId=${contentTypeId}` +
      `&defaultYN=Y&overviewYN=Y&addrinfoYN=Y&imageYN=Y&mapinfoYN=Y`;

    const response = await fetch(url);
    const data = await response.json();
    const info = data?.response?.body?.items?.item?.[0];

    if (!info) {
      return res.json({ noDetail: true });
    }

    const enhancedImg = await enhanceImage(info.title, info.mapy, info.mapx);
    const finalImage = enhancedImg || info.firstimage || null;

    res.json({
      contentId,
      contentTypeId,
      title: info.title,
      address: info.addr1,
      tel: info.tel,
      overview: cleanOverview(info.overview),
      homepage: info.homepage,
      mapX: info.mapx,
      mapY: info.mapy,
      image: finalImage,
    });
  } catch (err) {
    console.error("🔥 Detail API Error:", err);
    res.status(500).json({ error: "Tour Detail API error", details: err.message });
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
