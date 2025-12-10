// back/routes/place.js
import express from "express";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { generateDescription } from "../utils/aiDescription.js";

const router = express.Router();
const prisma = new PrismaClient();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

const cleanOverview = (text) => {
  if (!text || typeof text !== "string") return "설명 없음";
  const cleaned = text.replace(/<[^>]+>/g, "").trim();
  return cleaned.length > 0 ? cleaned : "설명 없음";
};

/* ===================================================================
   관광지 목록 조회, 관광 공사 Tour API 사용
=================================================================== */
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

    const result = await Promise.all(
      items.map(async (i) => {
        let overview = cleanOverview(i.overview);

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

/* ===================================================================
   여행지 좋아요 토글 (DB 저장하기, 확인 완료)
=================================================================== */
router.post("/like", async (req, res) => {
  const {
    userId,
    contentId,
    title,
    address,
    image,
    overview,
    liked,
    lat,
    lng,
    areaCode,
  } = req.body;

  if (!userId || !contentId) {
    return res.status(400).json({ error: "userId, contentId 필요" });
  }

  let uid;
  let extId;
  try {
    uid = BigInt(userId);
    extId = BigInt(contentId);
  } catch {
    return res.status(400).json({ error: "잘못된 ID 형식" });
  }

  try {
    // 기존 장소 검색하기
    let place = await prisma.place.findFirst({
      where: { external_id: extId },
    });

    // 없으면 새로 생성하기
    if (!place) {
      place = await prisma.place.create({
        data: {
          external_id: extId,
          name: title,
          address,
          image_url: image,
          description: overview || null, 
          lat: lat != null ? Number(lat) : null,
          lng: lng != null ? Number(lng) : null,
          city_id: null,
        },
      });
    }

    const pid = place.place_id;

    // 좋아요 존재 여부 확인하기
    const exists = await prisma.place_like.findFirst({
      where: { user_id: uid, place_id: pid },
    });

    // 좋아요 해제하기
    if (!liked) {
      if (exists) {
        await prisma.place_like.delete({ where: { like_id: exists.like_id } });
      }
      return res.json({ liked: false });
    }

    // 좋아요 추가하기
    if (!exists) {
      await prisma.place_like.create({
        data: {
          user_id: uid,
          place_id: pid,
        },
      });
    }

    return res.json({ liked: true });
  } catch (err) {
    console.error("place like toggle error:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* ===================================================================
   좋아요한 장소 목록 조회하기 (수정완료)
=================================================================== */
router.get("/like/place/:userId", async (req, res) => {
  const { userId } = req.params;

  let uid;
  try {
    uid = BigInt(userId);
  } catch {
    return res.status(400).json({ error: "잘못된 userId 형식" });
  }

  try {
    const likedPlacesRaw = await prisma.place_like.findMany({
      where: { user_id: uid },
      include: { place: true },
      orderBy: { like_id: "desc" },
    });

    // ★ BigInt → Number/String 변환 (JSON 오류 방지)
    const likedPlaces = likedPlacesRaw.map((row) => ({
      like_id: Number(row.like_id),
      user_id: Number(row.user_id),
      place_id: Number(row.place_id),
      created_at: row.created_at,
      place: row.place
        ? {
            ...row.place,
            place_id: Number(row.place.place_id),
            external_id:
              row.place.external_id !== null
                ? String(row.place.external_id)
                : null,
          }
        : null,
    }));

    res.json(likedPlaces);
  } catch (err) {
    console.error("좋아요 목록 조회 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

export default router;
