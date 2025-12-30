import fetch from "node-fetch";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

export async function searchPlaceNaver(keyword, cityName) {
  const query = `${cityName} ${keyword}`;

  const res = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=7`,
    {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
    }
  );

  const text = await res.text();
  if (!text.startsWith("{")) {
    console.error("❌ HTML 반환됨 (네이버 API 키 또는 호출 제한 이슈)");
    console.error(text.substring(0, 200));
    return [];
  }

  const data = JSON.parse(text);
  if (!data.items) return [];

  console.log("🔍 검색 결과 예시:", data.items[0]);

  return data.items.map((item) => {
    const title = item.title.replace(/<\/?b>/g, "");
    const encodedTitle = encodeURIComponent(title);

    return {
      title,
      address: item.roadAddress || item.address || null,
      lat: item.mapy ? parseFloat(item.mapy) / 1e7 : null,
      lng: item.mapx ? parseFloat(item.mapx) / 1e7 : null,
      searchUrl: `https://map.naver.com/v5/search/${encodedTitle}`,
    };
  });
}

export async function searchPlaceImage(title) {
  const res = await fetch(
    `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(title)}&display=1`,
    {
      headers: {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
      },
    }
  );

  const data = await res.json();
  return data.items?.[0]?.thumbnail || null;
}