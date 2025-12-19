// back/services/imageService.js
import axios from "axios";
import { searchGoogleDetails } from "../apis/googlePlace.js";

/**
 * 관광공사 이미지가 없을 때
 * Google Place + Naver 이미지 검색으로 썸네일 보강
 */
export async function enhanceImage(title, lat, lng) {
  try {
    // 1) Google Place Details 기반 보강
    const g = await searchGoogleDetails(lat, lng, title);

    if (g?.photoRef) {
      return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${
        g.photoRef
      }&key=${process.env.GOOGLE_API_KEY}`;
    }

    // 2) 그래도 없으면 Naver 이미지 검색
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
    if (nItem) {
      return nItem.thumbnail || nItem.link;
    }

    return null;
  } catch (err) {
    console.warn("⚠ 이미지 보강 실패(imageService):", err.message);
    return null;
  }
}

// 필요하면 나중에 다른 이미지 관련 함수들도 여기서 export 추가하면 됨
