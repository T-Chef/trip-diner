import express from "express";
import axios from "axios";
import { searchPlaceByKeyword } from "../../apis/tourApi.js";
import { searchGoogleDetails } from "../../apis/googlePlace.js";

const router = express.Router();

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

    const formatted = results.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      image:
        place.photos && place.photos.length > 0
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${
              place.photos[0].photo_reference
            }&key=${process.env.GOOGLE_API_KEY}`
          : null,
      rating: place.rating ?? null,
      reviews: place.user_ratings_total ?? 0,
      types: place.types ?? [],
      openNow: place.opening_hours?.open_now ?? null,
    }));

    return res.json({ results: formatted });
  } catch (err) {
    console.error("📌 Google Search API Error:", err.message || err);
    return res.status(500).json({ error: "google search failed" });
  }
});

router.get("/place-details", async (req, res) => {
  const { lat, lng, name } = req.query;

  try {
    let kor = null;
    try {
      kor = await searchPlaceByKeyword(name);
    } catch (e) {
      console.warn("⚠️ TourAPI 검색 실패(place-details):", e.message || e);
    }

    const korImg = kor?.image ?? null;
    const korAddr = kor?.address ?? null;

    const g = await searchGoogleDetails(lat, lng, name);

    const googleImg = g?.photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${g.photoRef}&key=${process.env.GOOGLE_API_KEY}`
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
        console.warn("⚠️ 네이버 이미지 검색 실패:", err.message || err);
      }
    }

    return res.json({
      name: kor?.name ?? g?.name ?? name,
      address: korAddr ?? g?.address ?? "주소 정보 없음",
      image: finalImg,
      category: g?.types ?? [], 
    });
  } catch (err) {
    console.error("📌 Place-Details API Error:", err);

    const fallbackName = req.query?.name ?? "";

    return res.json({
      name: fallbackName,
      address: "주소 정보 없음",
      image: null,
      category: [],
    });
  }
});

export default router;
