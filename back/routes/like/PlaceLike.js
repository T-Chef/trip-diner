import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

/* =================================================
  여행지 좋아요 토글
================================================= */
router.post("/place", async (req, res) => {
  const {
    userId,
    contentId,
    title,
    address,
    image,
    overview,
    lat,
    lng,
    areaCode,
    liked,
  } = req.body;

  if (!userId || !contentId) {
    return res.status(400).json({ error: "userId, contentId 필요" });
  }

  let uid, extId;
  try {
    uid = BigInt(userId);
    extId = BigInt(contentId);
  } catch {
    return res.status(400).json({ error: "잘못된 ID 형식" });
  }

  try {
    let place = await prisma.place.findFirst({
      where: { external_id: extId },
    });

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

    const placeId = place.place_id;

    const exists = await prisma.place_like.findFirst({
      where: {
        user_id: uid,
        place_id: placeId,
      },
    });

    if (!liked) {
      if (exists) {
        await prisma.place_like.delete({
          where: { like_id: exists.like_id },
        });
      }
      return res.json({ liked: false });
    }

    if (!exists) {
      await prisma.place_like.create({
        data: {
          user_id: uid,
          place_id: placeId,
        },
      });
    }

    return res.json({ liked: true });
  } catch (err) {
    console.error("여행지 좋아요 토글 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});

/* =================================================
  여행지 좋아요 목록 조회
================================================= */
router.get("/place/:userId", async (req, res) => {
  const { userId } = req.params;

  let uid;
  try {
    uid = BigInt(userId);
  } catch {
    return res.status(400).json({ error: "잘못된 userId 형식" });
  }

  try {
    const result = await prisma.place_like.findMany({
      where: { user_id: uid },
      include: { place: true },
      orderBy: { created_at: "desc" },
    });

    const safeResult = result.map((row) => ({
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

    res.json(safeResult);
  } catch (err) {
    console.error("여행지 좋아요 조회 오류:", err);
    res.status(500).json([]);
  }
});

export default router;
