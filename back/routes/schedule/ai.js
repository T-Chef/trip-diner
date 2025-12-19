// back/routes/ai.js
import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import { searchPlaceByKeyword } from "../../apis/tourApi.js";
import { searchPlaceNaver } from "../../apis/naverApi.js";
import { generateDescription } from "../../apis/generateDescription.js";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 후보 장소 순서를 섞는 유틸 함수
function shuffle(array) {
  return array
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v);
}

router.post("/plan", async (req, res) => {
  try {
    const { cityName, days, peopleType, themes } = req.body;

    if (!cityName || !days || !peopleType || !themes?.length) {
      return res.status(400).json({ error: "요청 데이터 부족" });
    }

    // ✅ 1) 테마 → 실제 검색 키워드 매핑
    const themeKeywordMap = {
      먹방: ["맛집", "음식점", "고기집", "해산물", "식당"],
      힐링: [
        "공원",
        "산책로",
        "정원",
        "온천",
        "스파",
        "온천 스파",
        "한적한 해변",
        "자연",
      ],
      액티비티: ["레저", "체험", "액티비티", "서핑", "카약", "패러글라이딩"],
      쇼핑: ["시장", "전통시장", "쇼핑몰", "아울렛"],
      문화: ["박물관", "미술관", "전시관", "공연장", "역사관"],
      자연: ["자연", "해변", "해수욕장", "폭포", "산", "호수", "전망대"],

      바다: ["바다", "해변", "해수욕장", "비치", "해안도로", "바다뷰 카페"],
      "산·자연": ["산", "숲길", "트레킹", "계곡", "폭포", "전망대"],
      "실내 여행지": [
        "실내",
        "아쿠아리움",
        "박물관",
        "미술관",
        "전시관",
        "키즈카페",
        "실내 테마파크",
        "쇼핑몰",
      ],
      "문화·역사": ["문화재", "유적지", "사찰", "성당", "문화센터", "역사관"],
      전통시장: ["전통시장", "시장", "재래시장", "올레시장"],
      "카페·디저트": ["카페", "디저트", "베이커리", "브런치 카페"],
      "SNS 핫플": ["인스타 핫플", "포토스팟", "감성 카페", "뷰맛집"],
      "축제·공연": ["축제", "페스티벌", "불꽃축제", "야시장", "공연장"],
      "체험·액티비티": ["체험", "액티비티", "레저", "서핑", "카약", "패러글라이딩"],
    };

    // ✅ 2) 테마 → 카테고리 묶기
    const themeCategoryMap = {
      먹방: "food",
      힐링: "healing",
      액티비티: "activity",
      쇼핑: "shopping",
      문화: "culture",
      자연: "nature",
      바다: "nature",
      "산·자연": "nature",
      "실내 여행지": "indoor",
      "문화·역사": "culture",
      전통시장: "market",
      "카페·디저트": "cafe",
      "SNS 핫플": "sns",
      "축제·공연": "festival",
      "체험·액티비티": "activity",
    };

    // ✅ 선택된 테마에 해당하는 카테고리 목록 (프롬프트에서 사용)
    const selectedThemeCategories = [
      ...new Set(
        themes
          .map((t) => themeCategoryMap[t])
          .filter(Boolean)
      ),
    ];

    // 🟢 3) 후보 장소 수집 (테마별 + 카테고리 포함)  ← 여기 완전 새 코드
    let placeCandidates = [];
    const candidateSeen = new Set();

    for (const theme of themes) {
      const keywords = themeKeywordMap[theme] || [theme];
      const category = themeCategoryMap[theme] || "etc";

      for (const keyword of keywords) {
        // 관광공사
        const tData = await searchPlaceByKeyword(keyword, cityName);
        if (Array.isArray(tData)) {
          for (const p of tData) {
            if (!p || !p.title || !p.lat || !p.lng) continue;
            const key = `${p.title}-${p.addr1 || p.address || ""}`;
            if (candidateSeen.has(key)) continue;
            candidateSeen.add(key);
            placeCandidates.push({
              ...p,
              address: p.addr1 || p.address || "",
              category,
            });
          }
        } else if (tData && (tData.title || tData.name)) {
          const title = tData.title || tData.name;
          const address = tData.addr1 || tData.address || "";
          const key = `${title}-${address}`;
          if (!candidateSeen.has(key)) {
            candidateSeen.add(key);
            placeCandidates.push({
              title,
              address,
              lat: tData.lat,
              lng: tData.lng,
              image: tData.image ?? null,
              category,
            });
          }
        }

        // 네이버
        const nData = await searchPlaceNaver(keyword, cityName);
        if (Array.isArray(nData)) {
          for (const p of nData) {
            if (!p || !p.title || !p.lat || !p.lng) continue;
            const key = `${p.title}-${p.addr1 || p.address || ""}`;
            if (candidateSeen.has(key)) continue;
            candidateSeen.add(key);
            placeCandidates.push({
              ...p,
              address: p.addr1 || p.address || "",
              category,
            });
          }
        } else if (nData && nData.title) {
          const key = `${nData.title}-${nData.addr1 || nData.address || ""}`;
          if (!candidateSeen.has(key)) {
            candidateSeen.add(key);
            placeCandidates.push({
              ...nData,
              address: nData.addr1 || nData.address || "",
              category,
            });
          }
        }
      }
    }

    console.log("📌 후보 장소(원본 수집):", placeCandidates.length);

    // 🔥 4) 도시 필터 + 중복 제거 (기존 로직 유지)
    const regionKeyword = cityName.replace(/시|도$/g, ""); // "제주도" → "제주"

    placeCandidates = placeCandidates
      .filter((p) => p && p.title && p.lat && p.lng)
      .filter((p) => {
        if (!p.address) return true;
        return p.address.includes(regionKeyword);
      })
      .filter(
        (p, i, arr) => arr.findIndex((x) => x.title === p.title) === i
      );

    console.log("📌 후보 장소(기본 정리 + 도시 필터 후):", placeCandidates.length);

    // 🚫 5) 여행에 안 어울리는 후보 제거
    const bannedTitleRegex = /(PC방|pc방|피시방|피씨방|노래방|학원|고시원)/i;
    placeCandidates = placeCandidates.filter(
      (p) => !bannedTitleRegex.test(p.title)
    );
    console.log("📌 후보 장소(금지 키워드 제거 후):", placeCandidates.length);

    placeCandidates = shuffle(placeCandidates).slice(0, 30);
    console.log("📌 후보 장소 확보(최종):", placeCandidates.length);

    if (placeCandidates.length === 0) {
      return res
        .status(404)
        .json({ error: "해당 도시/테마에 맞는 추천 장소가 없습니다." });
    }

    // 🧾 6) AI 프롬프트  ← 여기도 싹 교체
    const userPrompt = `
너는 대한민국 여행 플래너다.
반드시 아래 "사용 가능한 장소 목록" 안에 있는 장소만 사용해서 일정을 짠다.

[여행 기본 정보]
- 여행 도시: ${cityName}
- 일정: ${days}일
- 동행: ${peopleType}
- 선택된 테마: ${themes.join(", ")}
- 선택된 테마에 해당하는 카테고리: ${
      selectedThemeCategories.join(", ") || "없음"
    }

[카테고리 설명]
- food: 일반 음식점/맛집
- cafe: 카페/디저트/베이커리
- market: 전통시장/시장/재래시장
- activity: 레저/체험/액티비티/테마파크 등
- healing: 공원/산책로/온천/스파/뷰 좋은 카페 등
- nature: 바다, 산, 계곡, 전망대 등 자연 풍경
- indoor: 실내 여행지/실내 테마파크/아쿠아리움/전시관 등
- culture: 박물관/미술관/유적지/사찰/공연장 등
- sns: 인스타/SNS 핫플, 포토스팟
- festival: 축제/공연/야시장 등
- etc: 위 분류에 들어가지 않는 기타 장소

[테마 설명]
- "먹방"은 맛집, 음식점, 카페, 디저트 가게 등 음식 위주의 코스를 의미한다.
- "힐링"은 자연, 바다, 공원, 산책로, 온천/스파, 뷰 좋은 카페 등에서 편하게 쉴 수 있는 코스를 의미한다.
- "체험·액티비티" 또는 "액티비티"가 선택된 경우, 레저/체험/테마파크/스포츠/관람 시설 등 "음식점이 아닌" 활동을 의미한다.
- "바다"는 해수욕장, 해변, 바다뷰 카페, 해안도로 등의 코스를 의미한다.
- "카페·디저트"는 카페, 베이커리, 브런치 카페, 디저트 가게 위주의 코스를 의미한다.
- "전통시장"은 재래시장, 전통시장, 올레시장 등을 의미한다.

[중요 규칙 - 테마/카테고리 균형]
- 선택된 테마(${themes.join(
      ", "
    )})는 **일정 전체에서 모두 반영**해야 한다.
- 한 가지 테마나 한 가지 카테고리만 잔뜩 넣지 말고,
  선택된 테마/카테고리들이 일정 전체에 **가능한 한 골고루** 등장하도록 구성해라.
- ${selectedThemeCategories.length}개의 카테고리가 선택된 경우,
  어느 한 카테고리도 전체 장소의 **50%를 넘지 않도록** 구성하려고 노력해라.
- "전통시장" 테마가 선택되었고, market 카테고리 장소가 존재한다면
  → 일정 전체에서 **최소 1곳 이상** market 카테고리 장소를 반드시 포함해라.
- "카페·디저트" 테마가 선택되었다면, cafe 카테고리 장소가 모든 날 또는 대부분의 날에 등장하도록 노력해라.
- "먹방"이 선택되었더라도, 하루의 모든 장소를 food 카테고리로만 채우지 마라.
  반드시 food 이외의 카테고리를 섞어라.
- "먹방"과 "힐링"이 함께 선택된 경우,
  각 날짜마다 음식점(food) 1~3곳 + healing/nature/cafe 등의 쉬는 장소가 함께 포함되도록 구성해라.
- "먹방"과 "체험·액티비티" 또는 "액티비티"가 함께 선택된 경우,
  각 날짜마다 음식점(food) 1~3곳 + activity 카테고리 1~2곳이 섞이도록 구성해라.

[일정 구성 일반 규칙]
- 장소는 반드시 "사용 가능한 장소 목록"에 있는 이름을 그대로 사용해라.
- PC방, 노래방, 학원, 병원, 은행, 관공서 등 일상 생활 시설은 절대 포함하지 마라.
- 같은 장소를 여러 날에 중복 배치하지 마라.
- 하루에 4~6개의 장소를 추천하라.
- 이동 동선이 너무 왔다 갔다 하지 않도록 비슷한 위치끼리 묶어서 하루 코스를 만들어라.
- ${cityName} 내의 관광/맛집/카페/자연/명소 위주로 구성하라.
- 같은 조건으로 여러 번 요청을 받는 경우, 이전 일정과는 **장소 조합과 순서가 최대한 다르게** 나오도록 구성해라.

[사용 가능한 장소 목록]
아래 목록의 "분류"는 위에서 정의한 카테고리 중 하나이다.
이 분류를 참고하여, 선택된 테마/카테고리가 일정 전체에 골고루 등장하도록 구성해라.

${placeCandidates
  .map((p) => `- ${p.title} (분류: ${p.category || "etc"})`)
  .join("\n")}

[응답 형식]
아래 JSON 형식으로만 출력해라. 다른 텍스트 절대 금지.

{
  "title": "${cityName} 여행",
  "days": [
    {
      "day": 1,
      "places": [
        {
          "name": "장소명(위 목록 중 하나)",
          "startTime": "09:00",
          "endTime": "11:00"
        }
      ]
    }
  ]
}
`;

    // 🧠 7) AI 실행 (여기부터는 기존 코드 그대로)
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9, 
      top_p: 0.95, 
      messages: [
        { role: "system", content: "너는 최고의 여행 플래너다." },
        { role: "user", content: userPrompt },
      ],
    });

    let result = completion.choices[0].message.content.trim();
    result = result.replace(/```json/g, "").replace(/```/g, "").trim();

    const aiPlan = JSON.parse(result);
    console.log("📌 병합 전:", JSON.stringify(aiPlan, null, 2));

    // 🔗 좌표 + 주소 merge
    aiPlan.days = (aiPlan.days || []).map((day) => ({
      ...day,
      places: (day.places || []).map((p) => {
        const info = placeCandidates.find(
          (c) => c.title.replace(/\s+/g, "") === p.name.replace(/\s+/g, "")
        );

        if (info) {
          return {
            ...p,
            name: info.title,
            title: info.title,
            lat: info.lat > 1000 ? info.lat / 1e7 : info.lat,
            lng: info.lng > 1000 ? info.lng / 1e7 : info.lng,
            address: info.address,
            image: info.image ?? null,
            category: info.category ?? p.category,
          };
        }
        return p;
      }),
    }));

    // 🧭 동선 기준 재배치 (기존 코드 그대로)
    let allPlaces = [];
    const seen = new Set();

    for (const day of aiPlan.days || []) {
      for (const p of day.places || []) {
        if (!p.lat || !p.lng || !p.name) continue;
        const key = p.name;
        if (seen.has(key)) continue;
        seen.add(key);
        allPlaces.push(p);
      }
    }

    if (allPlaces.length > 0) {
      allPlaces.sort((a, b) => a.lng - b.lng);

      const totalDays = Number(days) || aiPlan.days.length || 1;
      const perDay = Math.ceil(allPlaces.length / totalDays);

      const rebuiltDays = [];

      for (let d = 0; d < totalDays; d++) {
        const slice = allPlaces.slice(d * perDay, (d + 1) * perDay);
        if (!slice.length) continue;

        const withTime = slice.map((p, idx) => {
          const startHour = 9 + idx * 2;
          const endHour = startHour + 2;
          const pad = (n) => String(n).padStart(2, "0");

          return {
            ...p,
            startTime: `${pad(startHour)}:00`,
            endTime: `${pad(endHour)}:00`,
          };
        });

        rebuiltDays.push({
          day: d + 1,
          places: withTime,
        });
      }

      aiPlan.days = rebuiltDays;
    }

    // 🔥 각 장소에 한 줄 요약 설명 붙이기
    const descCache = new Map();
    for (const day of aiPlan.days || []) {
      for (const p of day.places || []) {
        const key = (p.name || p.title || "") + (p.address || "");

        if (!descCache.has(key)) {
          const desc = await generateDescription(
            p.name || p.title || "",
            p.address || ""
          );
          descCache.set(key, desc);
        }

        p.description = descCache.get(key);
      }
    }

    // 🔹 프론트에서 요약 카드/태그에 쓸 메타 정보
    aiPlan.cityName = cityName;
    aiPlan.daysCount = Number(days);
    aiPlan.peopleType = peopleType;
    aiPlan.themes = themes;

    return res.json({ aiPlan });
  } catch (err) {
    console.error("AI 일정 생성 오류:", err);
    return res.status(500).json({ error: "AI 일정 생성 실패" });
  }
});

export default router;