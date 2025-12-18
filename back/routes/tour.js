// back/routes/tour.js
import express from "express";
import "dotenv/config";

const router = express.Router();
const TOUR_API_KEY = process.env.TOUR_API_KEY;

/* -----------------------------------------
   🔹 전국 광역시/도 목록 반환
----------------------------------------- */
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

/* -----------------------------------------
   🔹 특정 시/도(areaCode)의 시군구 목록 반환
----------------------------------------- */
router.get("/areas", async (req, res) => {
  const { areaCode } = req.query;
  if (!areaCode) return res.status(400).json({ error: "areaCode 필요" });

  try {
    const encodedKey = encodeURIComponent(TOUR_API_KEY);

    const url =
      `https://apis.data.go.kr/B551011/KorService2/areaCode2?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&areaCode=${areaCode}` +
      `&numOfRows=200&pageNo=1&_type=json`;

    const response = await fetch(url);
    const data = await response.json();

    const items = data?.response?.body?.items?.item || [];
    const result = items.map((i) => ({
      name: i.name,
      sigunguCode: i.code,
    }));

    res.json(result);
  } catch (err) {
    console.error("🔥 Tour API Error:", err);
    res.status(500).json({ error: "Tour API error", details: err.message });
  }
});

export default router;

