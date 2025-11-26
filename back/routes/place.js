// back/routes/place.js
import express from "express";
//import fetch from "node-fetch";
import "dotenv/config";

const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

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

    const result = items.map(i => ({
      contentId: i.contentid,
      contentTypeId: i.contenttypeid,
      title: i.title,
      address: i.addr1,
      tel: i.tel,
      latitude: i.mapy,
      longitude: i.mapx,
      image: i.firstimage
    }));

    res.json(result);
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

export default router;
