// back/routes/place.js
import express from "express";
//import fetch from "node-fetch";
import "dotenv/config";

import { generateDescription } from "../utils/aiDescription.js";

const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;
const cleanText = (t) => t?.replace(/\n/g, " ").trim() ?? "";

// HTML 정리 + 기본 설명 처리
const cleanOverview = (text) => {
  if (!text || typeof text !== "string") return "설명 없음";

  // 🔥 HTML 태그 제거
  const cleaned = text.replace(/<[^>]+>/g, "").trim();
  if (cleaned.length === 0) return "설명 없음";

  return cleaned;      
};

/**
 * 관광지 목록 조회
 * GET /api/tour/places?areaCode=6&sigunguCode=8
 */
router.get("/places", async (req, res) => {
  const { areaCode, sigunguCode, contentTypeId } = req.query;
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

     // ------------------------------
    // 🔥 상세 overview 가져오는 함수
    // ------------------------------
    const fetchOverview = async (contentId, contentTypeId) => {
      try {
        const detailUrl =
          `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodedKey}` +
          `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
          `&contentId=${contentId}&contentTypeId=${contentTypeId}` +
          `&overviewYN=Y&defaultYN=Y`;

        const res = await fetch(detailUrl);
        const json = await res.json();

        return json?.response?.body?.items?.item?.[0]?.overview || null;
      } catch {
        return null;
      }
    };

    // ------------------------------
    // 🔥 목록 + overview 결합
    // ------------------------------
    const result = await Promise.all(
      items.map(async (i) => {
        let overviewRaw = await fetchOverview(i.contentid, i.contenttypeid);
        let overview = cleanOverview(overviewRaw);

        // 🔥 관광공사 설명이 "설명 없음"이면 AI로 자동 생성
        if (overview === "설명 없음") {
          const safeAddress = cleanText(i.addr1);
          overview = await generateDescription(i.title, safeAddress);
        }

        return {
          contentId: i.contentid,
          contentTypeId: i.contenttypeid,
          title: i.title,
          address: i.addr1,
          tel: i.tel,
          latitude: i.mapy,
          longitude: i.mapx,
          image: i.firstimage,
          overview,
        };
      })
    );

    // 검색어 필터링 넣는 위치
    let filtered = result;
    if (req.query.keyword) {
    const kw = req.query.keyword.trim().toLowerCase();

    filtered = result.filter((p) => {
      const title = p.title ? p.title.toLowerCase() : "";
      const address = p.address ? p.address.toLowerCase() : "";
      const overview = p.overview ? p.overview.toLowerCase() : "";

      return (
        title.includes(kw) ||
        address.includes(kw) ||
        overview.includes(kw)
      );
    });
  }

    res.json(filtered);

  } catch (err) {
    console.error("🔥 Place API Error:", err);
    res.status(500).json({ error: "Tour API place error", detail: err.message });
  }
});

/**
 * 관광지 상세 정보
 * GET /api/tour/place/detail?contentId=2755676&contentTypeId=12
 */
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

    // 상세 정보 없음 (공식 API에도 없음)
    if (!info) {
      return res.json({
        noDetail: true,
        contentId,
        contentTypeId
      });
    }

    const result = {
      contentId,
      contentTypeId,
      title: info.title,
      address: info.addr1,
      tel: info.tel,
      overview: info.overview,
      homepage: info.homepage,
      mapX: info.mapx,
      mapY: info.mapy,
      image: info.firstimage
    };

    res.json(result);
  } catch (err) {
    console.error("🔥 Tour Detail API Error:", err);
    res.status(500).json({ error: "Tour Detail API error", details: err.message });
  }
});

/* 좋아요(DB) 저장 API */
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
