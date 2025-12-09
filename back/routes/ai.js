import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import { searchPlaceByKeyword } from "../apis/tourApi.js";
import { searchPlaceNaver } from "../apis/naverApi.js";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/plan", async (req, res) => {
  try {
    const { cityName, days, peopleType, themes } = req.body;

    // 🟢 AI 실행 전: 후보 장소 수집 단계
    let placeCandidates = [];

    // 관광공사 검색
    for (const theme of themes) {
      const tData = await searchPlaceByKeyword(theme, cityName);
      if (tData) placeCandidates.push(tData);
    }

    // 네이버 검색
    for (const theme of themes) {
      const nData = await searchPlaceNaver(theme, cityName);
      if (nData) placeCandidates.push(...nData);
    }

    // 중복 제거 & 좌표 없는 건 제외
    placeCandidates = placeCandidates
      .filter((p) => p.title && p.lat && p.lng)
      .filter((p, i, arr) => arr.findIndex(x => x.title === p.title) === i)
      .slice(0, 20);

    console.log("📌 후보 장소 확보:", placeCandidates.length);

    if (placeCandidates.length === 0) {
      return res.status(404).json({ error: "추천 장소 없음" });
    }

    // 2️⃣ AI Prompt 생성 — 목록에서만 선택
    const userPrompt = `
너는 대한민국 여행 플래너다.
아래 장소 목록에서만 일정을 구성해라.

여행 도시: ${cityName}
일정: ${days}일
동행: ${peopleType}
테마: ${themes.join(", ")}

사용 가능한 장소 목록:
${placeCandidates.map((p) => `- ${p.title}`).join("\n")}

JSON만 출력해. 다른 텍스트 절대 금지
{
 "title": "${cityName} 여행",
 "days": [
   {
     "day": 1,
     "places": [
       {
         "name": "장소명",
         "startTime": "09:00",
         "endTime": "11:00"
       }
     ]
   }
 ]
}
`;

    // 3️⃣ AI 실행
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 최고의 여행 플래너다." },
        { role: "user", content: userPrompt },
      ],
    });

    let result = completion.choices[0].message.content.trim();
    // 코드블록 제거 처리
    result = result.replace(/```json/g, "").replace(/```/g, "").trim();
    const aiPlan = JSON.parse(result);

    console.log("📌 병합 전:", JSON.stringify(aiPlan, null, 2));

    // 4️⃣ 좌표 + 주소 merge
    aiPlan.days = aiPlan.days.map((day) => ({
      ...day,
      places: day.places.map((p) => {
        const info = placeCandidates.find((c) =>
          c.title.replace(/\s+/g, "") === p.name.replace(/\s+/g, "")
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
          };
        }

        return p;
      }),
    }));

    return res.json({ aiPlan });

  } catch (err) {
    console.error("AI 일정 생성 오류:", err);
    return res.status(500).json({ error: "AI 일정 생성 실패" });
  }
});

export default router;
