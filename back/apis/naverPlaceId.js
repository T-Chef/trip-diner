// back/apis/naverPlaceId.js
import fetch from "node-fetch";

export async function getPlaceIdFromSearchUrl(searchUrl) {
  try {
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    const html = await res.text();

    const match = html.match(/"id":\s*([0-9]{5,20})/);
    return match ? match[1] : null;

  } catch (err) {
    console.error("❌ placeId 추출 실패:", searchUrl);
    return null;
  }
}