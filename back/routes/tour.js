// back/routes/tour.js
import express from "express";
//import fetch from "node-fetch";
import "dotenv/config";

const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

// 도시 목록
router.get("/cities", (req, res) => {
  const cities = [
    { name: "서울", areaCode: 1 },
    { name: "인천", areaCode: 2 },
    { name: "대전", areaCode: 3 },
    { name: "대구", areaCode: 4 },
    { name: "광주", areaCode: 5 },
    { name: "부산", areaCode: 6 },
    { name: "울산", areaCode: 7 },
    { name: "세종", areaCode: 8 },
    { name: "경기", areaCode: 31 },
    { name: "강원", areaCode: 32 },
    { name: "충북", areaCode: 33 },
    { name: "충남", areaCode: 34 },
    { name: "경북", areaCode: 35 },
    { name: "경남", areaCode: 36 },
    { name: "전북", areaCode: 37 },
    { name: "전남", areaCode: 38 },
    { name: "제주", areaCode: 39 },
  ];
  res.json(cities);
});

// 시군구 목록 요청
router.get("/areas", async (req, res) => {
  const { areaCode } = req.query;
  if (!areaCode) return res.status(400).json({ error: "areaCode 필요" });

  try {
    const encodedKey = encodeURIComponent(process.env.TOUR_API_KEY);

    const url =
      `https://apis.data.go.kr/B551011/KorService2/areaCode2?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&areaCode=${areaCode}` +
      `&numOfRows=200&pageNo=1&_type=json`;

    const response = await fetch(url);
    const data = await response.json();

    const items = data?.response?.body?.items?.item || [];
    const result = items.map(i => ({
      name: i.name,
      sigunguCode: i.code
    }));

    res.json(result);
  } catch (err) {
    console.error("🔥 Tour API Error:", err);
    res.status(500).json({ error: "Tour API error", details: err.message });
  }
});

// 관광지 목록 (areaCode + sigunguCode 기준)
router.get("/places", async (req, res) => {
  const { areaCode, sigunguCode } = req.query;
  if (!areaCode) return res.status(400).json({ error: "areaCode 필요" });

  try {
    const encodedKey = encodeURIComponent(process.env.TOUR_API_KEY);

    let url =
      `https://apis.data.go.kr/B551011/KorService2/areaBasedList2?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&_type=json&numOfRows=200&pageNo=1` +
      `&areaCode=${areaCode}`;

    if (sigunguCode) url += `&sigunguCode=${sigunguCode}`;

    const response = await fetch(url);
    const data = await response.json();

    const items = data?.response?.body?.items?.item || [];

    const result = items.map(i => ({
      contentId: i.contentid,
      contentTypeId: i.contenttypeid,
      title: i.title,
      address: i.addr1,
      tel: i.tel,
      mapX: i.mapx,
      mapY: i.mapy,
      image: i.firstimage
    }));

    res.json(result);
  } catch (err) {
    console.error("🔥 Tour Places API Error:", err);
    res.status(500).json({ error: "Tour Places API error", details: err.message });
  }
});

// 관광지 상세 정보
router.get("/place/detail", async (req, res) => {
  const { contentId, contentTypeId } = req.query;

  if (!contentId) return res.status(400).json({ error: "contentId 필요" });
  if (!contentTypeId) return res.status(400).json({ error: "contentTypeId 필요" });

  try {
    const encodedKey = encodeURIComponent(process.env.TOUR_API_KEY);

    const url =
      `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
      `&contentId=${contentId}&contentTypeId=${contentTypeId}` +
      `&defaultYN=Y&overviewYN=Y&addrinfoYN=Y&imageYN=Y&mapinfoYN=Y`;

    const response = await fetch(url);
    const data = await response.json();
    const info = data?.response?.body?.items?.item?.[0];

    // 🔥 상세가 없는 관광지는 따로 표시
    if (!info) {
      return res.json({ noDetail: true });
    }

    const result = {
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
