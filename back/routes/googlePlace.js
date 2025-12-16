import express from "express";
import axios from "axios";
import { searchPlaceByKeyword } from "../apis/tourApi.js";
import { searchGoogleDetails } from "../apis/googlePlace.js";

const router = express.Router();

/* -------------------------------------------------------
   🔍 Google Text Search - 장소 검색용 API 추가
------------------------------------------------------- */
router.get("/place-search", async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: "keyword required" });
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      keyword
    )}&language=ko&key=${process.env.GOOGLE_API_KEY}`;

    const resp = await axios.get(url);
    const results = resp.data.results || [];

    // 응답 데이터 최소 정제
    const formatted = results.map((place) => ({
  placeId: place.place_id,
  name: place.name,
  address: place.formatted_address,
  lat: place.geometry?.location?.lat,
  lng: place.geometry?.location?.lng,
  image:
  place.photos && place.photos.length > 0
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${
        place.photos[0].photo_reference
      }&key=${process.env.GOOGLE_API_KEY}`
    : null,
  rating: place.rating ?? null,
  reviews: place.user_ratings_total ?? 0,
  types: place.types ?? [],
  openNow: place.opening_hours?.open_now ?? null,
}));

    res.json({ results: formatted });
  } catch (err) {
    console.error("📌 Google Search API Error:", err.message);
    res.status(500).json({ error: "google search failed" });
  }
});

/* -------------------------------------------------------
   📍 상세 정보 조회 (기존 코드 유지)
------------------------------------------------------- */
router.get("/place-details", async (req, res) => {
  try {
    const { lat, lng, name } = req.query;

    const k = await searchPlaceByKeyword(name);
    const korImg = k?.image ?? null;
    const korAddr = k?.address ?? null;

    const g = await searchGoogleDetails(lat, lng, name);

    const googleImg = g?.photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${g.photoRef}&key=${process.env.GOOGLE_API_KEY}`
      : null;

    let finalImg = korImg || googleImg || null;

    if (!finalImg && name) {
      try {
        const naverImgRes = await axios.get(
          `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(
            name
          )}&display=1`,
          {
            headers: {
              "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
              "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
            },
          }
        );

        const imgItems = naverImgRes.data.items;
        if (imgItems && imgItems.length > 0) {
          finalImg = imgItems[0].thumbnail || imgItems[0].link || null;
        }
      } catch (err) {
        console.warn("⚠️ 네이버 이미지 검색 실패:", err);
      }
    }

    res.json({
      name: k?.name ?? g?.name ?? name,
      address: korAddr ?? g?.address ?? "주소 정보 없음",
      image: finalImg,
      category: g?.types ?? [],
    });
  } catch (err) {
    console.error("📌 Place-Details API Error:", err);
    res.json({
      name,
      address: "주소 정보 없음",
      image: null,
      category: [],
    });
  }
});

export default router;
