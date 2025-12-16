// back/routes/place.js
import express from "express";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateDescription } from "../utils/aiDescription.js";

const router = express.Router();
const prisma = new PrismaClient();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

/* -------------------------------------------------------
   공공 API overview 정리용 유틸
------------------------------------------------------- */
const cleanOverview = (text) => {
  if (!text || typeof text !== "string") return "설명 없음";
  const cleaned = text.replace(/<[^>]+>/g, "").trim();
  return cleaned.length > 0 ? cleaned : "설명 없음";
};

/* ===================================================================
   관광지 목록 조회 (한국관광공사 Tour API)
   GET /api/place/places
=================================================================== */
router.get("/places", async (req, res) => {
  const { areaCode, sigunguCode, contentTypeId } = req.query;

  if (!areaCode) {
    return res.status(400).json({ error: "areaCode 필요" });
  }

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

    const result = await Promise.all(
      items.map(async (i) => {
        let overview = cleanOverview(i.overview);

        // overview 없을 경우 AI 설명 생성
        if (overview === "설명 없음") {
          overview = await generateDescription(i.title, i.addr1 || "");
        }

        return {
          contentId: i.contentid,
          title: i.title,
          address: i.addr1,
          latitude: i.mapy,
          longitude: i.mapx,
          image: i.firstimage,
          overview,
          areaCode,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error("🔥 Place API Error:", err);
    res.status(500).json({ error: "Tour API place error" });
  }
});

export default router;
