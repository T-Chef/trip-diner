import fetch from "node-fetch";

export async function getNaverPlaceDetail(placeId) {
  try {
    const url = `https://map.naver.com/v5/api/sites/summary/${placeId}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const data = await res.json();
    return {
      tel: data?.tel,
      rating: data?.rating,
      reviewCount: data?.reviewCount,
      bizhour: data?.businessHours ?? [],
      photos: data?.thumUrlList ?? [], 
    };
  } catch (err) {
    console.error("📌 상세정보 수집 실패:", err);
    return null;
  }
}