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
   NAVER Local API로 전화번호 보강
------------------------------------------------------- */
async function enhanceWithNaverLocal(title, address) {
  try {
    const query = `${title || ""} ${address || ""}`.trim();
    if (!query) return {};

    const res = await axios.get(
      "https://openapi.naver.com/v1/search/local.json",
      {
        params: {
          query,
          display: 1,
        },
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    const item = res.data.items?.[0];
    if (!item) return {};

    console.log("✅ Naver Local hit:", query, "→", item.telephone);

    return {
      tel: item.telephone || "",
      roadAddress: item.roadAddress || "",
      category: item.category || "",
    };
  } catch (err) {
    console.warn("⚠ Naver Local 보강 실패:", err.message);
    return {};
  }
}

// 네이버 category → 태그 배열로 변환
function buildTagsFromCategory(category, contentTypeId) {
  const tags = [];

  if (category) {
    const parts = category
      .split(/[>\/,]/)           // "한식 > 국수,면요리" 이런 거 쪼개기
      .map(p => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      if (part.includes("카페")) tags.push("카페");
      else if (part.includes("디저트") || part.includes("빵") || part.includes("베이커리"))
        tags.push("베이커리");
      else if (part.includes("한식")) tags.push("한식");
      else if (part.includes("양식")) tags.push("양식");
      else if (part.includes("중식")) tags.push("중식");
      else if (part.includes("일식")) tags.push("일식");
      else if (!tags.includes(part)) tags.push(part);
    }
  }

  // 그래도 아무것도 없으면 contentTypeId 기준으로 대략
  if (tags.length === 0 && contentTypeId) {
    const type = String(contentTypeId);
    if (type === "39") tags.push("음식점");
    else if (type === "12") tags.push("관광지");
    else if (type === "32") tags.push("숙박");
  }

  // 중복 제거 + 최대 3개까지만
  return [...new Set(tags)].slice(0, 3);
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
      items.map(async (i, idx) => {
        const contentId = i.contentid;
        const typeId = i.contenttypeid;

        // 1) 관광공사 overview
        let overviewRaw = await fetchOverview(i.contentid)
        let overview = cleanOverview(overviewRaw);

        // 2) overview 없을 시 AI 생성
        if (overview === "설명 없음" && idx < 20) {
          const safeAddress = cleanText(i.addr1);
          overview = await generateDescription(i.title, safeAddress);
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
          image: finalImage, 
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
      filtered = filtered.filter((p) => {
        const t = p.title?.toLowerCase() || "";
        const a = p.address?.toLowerCase() || "";
        const o = p.overview?.toLowerCase() || "";
        return t.includes(kw) || a.includes(kw) || o.includes(kw);
      });
    }

    res.json(filtered);
  } catch (err) {
    console.error("🔥 Place API Error:", err);
    res.status(500).json({ error: "Tour API place error", detail: err.message });
  }
});

/* -------------------------------------------------------
   관광지 상세 정보  + detailIntro2 로 전화번호/편의시설 보강
------------------------------------------------------- */
router.get("/detail", async (req, res) => {
  const { 
    contentId, 
    contentTypeId, 
    title: fallbackTitle,
    address: fallbackAddress,
    tel: fallbackTel, 
  } = req.query;

  if (!contentId) return res.status(400).json({ error: "contentId 필요" });
  if (!contentTypeId) return res.status(400).json({ error: "contentTypeId 필요" });

  try {
    const encodedKey = encodeURIComponent(TOUR_API_KEY);

    /* 1) detailCommon2 : 기본 주소/개요/좌표/이미지 */
    const commonUrl =
      `https://apis.data.go.kr/B551011/KorService2/detailCommon2?serviceKey=${encodedKey}` +
      `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
      `&contentId=${contentId}&contentTypeId=${contentTypeId}` +
      `&defaultYN=Y&overviewYN=Y&addrinfoYN=Y&imageYN=Y&mapinfoYN=Y`;

    const commonRes = await fetch(commonUrl);
    const commonRaw = await commonRes.text();  

    let commonJson;
    try {
      commonJson = JSON.parse(commonRaw);
    } catch (parseErr) {
      console.error("🔥 DetailCommon Raw response (not JSON):", commonRaw);
      
       // 관광공사 응답이 이상해도, 네이버 Local로 최대한 보강
      let tel = fallbackTel || "";
      let tags = [];

      if (fallbackTitle || fallbackAddress) {
        const extra = await enhanceWithNaverLocal(
          fallbackTitle || "",
          fallbackAddress || ""
        );
        tel = extra.tel || tel;
        tags = buildTagsFromCategory(extra.category || "", contentTypeId);
      }

      return res.json({
        contentId,
        contentTypeId,
        title: "상세 정보를 불러오지 못했습니다.",
        address: "",
        tel,
        overview: "",
        homepage: "",
        mapX: null,
        mapY: null,
        image: null,
        hasParking: false,
        petFriendly: false,
        takeout: false,
        hasWifi: false,
        tags,
        noDetail: true,
      });
    }

    const info = commonJson?.response?.body?.items?.item?.[0];

    // 아예 상세 없을 때
    if (!info) {
      let tel = fallbackTel || "";
      let tags = [];

      if (fallbackTitle || fallbackAddress) {
        const extra = await enhanceWithNaverLocal(
          fallbackTitle || "",
          fallbackAddress || ""
        );
        tel = extra.tel || tel;
        tags = buildTagsFromCategory(extra.category || "", contentTypeId);
      }

      return res.json({
        contentId,
        contentTypeId,
        title: "상세 정보 없음",
        address: "",
        tel,
        overview: "",
        homepage: "",
        mapX: null,
        mapY: null,
        image: null,
        hasParking: false,
        petFriendly: false,
        takeout: false,
        hasWifi: false,
        noDetail: true,
      });
    }

    /* 2) 기본 전화번호 " detailCOmmon + 목록 fallback" */
    let tel = info.tel || fallbackTel || "";
    let hasParking = false;
    let petFriendly = false;
    let takeout = false;
    let hasWifi = false;
    let tags = [];

    // 4) detailIntro2로 편의시설 + 안내전화 보강
    try {
      const introUrl =
        `https://apis.data.go.kr/B551011/KorService2/detailIntro2?serviceKey=${encodedKey}` +
        `&MobileOS=ETC&MobileApp=TripDiner&_type=json` +
        `&contentId=${contentId}&contentTypeId=${contentTypeId}`;

      const introRes = await fetch(introUrl);
      const introRaw = await introRes.text();

      let introJson;
      try {
        introJson = JSON.parse(introRaw);
      } catch (e) {
        console.error("🔥 DetailIntro Raw response (not JSON):", introRaw);
      }

      const intro = introJson?.response?.body?.items?.item?.[0];

      if (intro) {
        // 🔸 안내전화 : 타입별로 필드가 다름 → 우선순위로 가져오기
        tel =
          intro.infocenterfood ||   // 음식점
          intro.infocentertour ||   // 관광지
          intro.infocenterleports ||// 레포츠
          intro.infocenter ||       // 기타
          tel;

        // 🔸 주차 여부 (타입별 필드 이름 다름)
        const parkingText =
          intro.parkingfood ||
          intro.parkingculture ||
          intro.parkingleports ||
          intro.parkingfestival ||
          intro.parkinglodging ||
          intro.parking ||
          "";

        if (parkingText && !/없음|불가/.test(String(parkingText))) {
          hasParking = true;
        }

        // 🔸 포장 여부 (음식점에서 주로 나옴)
        const packingText = intro.packing || "";
        if (packingText && !/없음|불가/.test(String(packingText))) {
          takeout = true;
        }

        // 🔸 반려동물 동반 (타입별 chkpet* 계열)
        const petText =
          intro.chkpet ||
          intro.chkpetculture ||
          intro.chkpetleports ||
          intro.chkpetfestival ||
          intro.chkpetshopping ||
          intro.chkpetetc ||
          "";
        if (petText && !/불가|금지/.test(String(petText))) {
          petFriendly = true;
        }
      }
    } catch (e) {
      console.warn("⚠ detailIntro 불러오기 실패:", e.message);
    }

  /* 5) 네이버 Local 로 전화번호 한 번 더 보강 */
   try {
      const extra = await enhanceWithNaverLocal(
        info.title || fallbackTitle || "",
        info.addr1 || fallbackAddress || ""
      );

      if (extra.tel && !tel) {
        tel = extra.tel;
      }

      if (extra.category) {
        tags = buildTagsFromCategory(extra.category, contentTypeId);
      }
    } catch (e) {
      console.warn("⚠ Naver Local 태그 보강 실패:", e.message);
    }

    /* 6) 이미지 보강 (Google / Naver) */
    let finalImage = info.firstimage || null;
    try {
      const enhancedImg = await enhanceImage(info.title, info.mapy, info.mapx);
      if (enhancedImg) finalImage = enhancedImg;
    } catch (e) {
      console.warn("⚠ 이미지 보강 실패(detail):", e.message);
    }

    /* 5) 최종 응답 – 영업시간은 제거, 전화번호/편의시설만 */
    return res.json({
      contentId,
      contentTypeId,
      title: info.title,
      address: info.addr1,
      tel,                                   
      overview: cleanOverview(info.overview),
      homepage: info.homepage,
      mapX: info.mapx,
      mapY: info.mapy,
      image: finalImage,
      hasParking,
      petFriendly,
      takeout,
      hasWifi,
      tags,
      noDetail: false,
    });
  } catch (err) {
    console.error("🔥 Detail API Error:", err);

    // 🔁 관광공사 통신 실패 시에도 최대한 fallback 응답 보내기
  let tel = fallbackTel || "";
  let tags = [];

  try {
    if (fallbackTitle || fallbackAddress) {
      const extra = await enhanceWithNaverLocal(
        fallbackTitle || "",
        fallbackAddress || ""
      );
      if (extra.tel) {
        tel = extra.tel;
      }
      if (extra.category) {
        tags = buildTagsFromCategory(extra.category, contentTypeId);
      }
    }
  } catch (e) {
    console.warn("⚠ fallback Naver Local 도 실패:", e.message);
  }

  return res.json({
    contentId,
    contentTypeId,
    title: fallbackTitle || "상세 정보를 불러오지 못했습니다.",
    address: fallbackAddress || "",
    tel,
    overview: "",
    homepage: "",
    mapX: null,
    mapY: null,
    image: null,
    hasParking: false,
    petFriendly: false,
    takeout: false,
    hasWifi: false,
    tags,
    noDetail: true,  // 👉 프론트에서 “상세 API 없음” 배지용
  });
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
