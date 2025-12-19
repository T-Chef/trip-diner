// back/services/naverService.js
import axios from "axios";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

/**
 * Naver Local API로 전화번호/카테고리 보강
 */
export async function enhanceWithNaverLocal(title, address) {
  try {
    const query = `${title || ""} ${address || ""}`.trim();
    if (!query) return {};

    const res = await axios.get(
      "https://openapi.naver.com/v1/search/local.json",
      {
        params: { query, display: 1 },
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
      }
    );

    const item = res.data.items?.[0];
    if (!item) return {};

    console.log("✅ Naver Local hit:", {
      title: item.title,
      telephone: item.telephone,
      category: item.category,
      roadAddress: item.roadAddress,
    });

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

/**
 * Naver 이미지 검색 (필요하면 재사용)
 */
export async function searchNaverImage(title) {
  try {
    const res = await axios.get(
      `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(
        title
      )}&display=1`,
      {
        headers: {
          "X-Naver-Client-Id": NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
        },
      }
    );

    const item = res.data.items?.[0];
    if (!item) return null;

    return item.thumbnail || item.link || null;
  } catch (err) {
    console.warn("⚠ Naver 이미지 검색 실패:", err.message);
    return null;
  }
}
