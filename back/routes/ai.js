import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import { searchPlaceByKeyword } from "../apis/tourApi.js";

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/plan", async (req, res) => {
  try {
    const {
      cityName,
      districtName,
      days,
      peopleType,
      themes,
    } = req.body;

    const userPrompt = `
      여행 도시: ${cityName}
      지역: ${districtName ?? "해당 없음"}
      일정: ${days}일
      동행: ${peopleType}
      테마: ${themes.join(", ")}

      아래 형식 **그대로** JSON만 출력해.
      절대 한국어 설명, 불릿, 코드블럭 없이 JSON만 출력해.

      {
        "title": "string",
        "days": [
          {
            "day": number,
            "places": [
              {
                "name": "string",
                "time": "string",
                "memo": "string",
                "lat": number,
                "lng": number
              }
            ]
          }
        ]
      }
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 최고의 여행 플래너다." },
        { role: "user", content: userPrompt },
      ],
    });

    let result = completion.choices[0].message.content;
    result = result.replace(/```json|```/g, "").trim();
    let aiPlan = JSON.parse(result);

    // 🟢 관광공사 API — 사진/주소/홈페이지만 보강 (⚠ 좌표는 AI 그대로)
    for (const day of aiPlan.days) {
      for (let i = 0; i < day.places.length; i++) {
        const place = day.places[i];
        const info = await searchPlaceByKeyword(place.name, cityName);

        if (info) {
          place.image = info.image ?? null;
          place.address = info.address ?? null;
          place.contentId = info.contentId ?? null;
          place.homepage = info.homepage ?? null;

          // ⚠ lat/lng 절대 덮어쓰지 않음
          // place.lat 그대로
          // place.lng 그대로
        } else {
          console.log(`🔍 관광공사 검색 실패: ${place.name}`);
        }
      }
    }

    return res.json({ aiPlan });

  } catch (e) {
    console.error("AI 일정 생성 오류:", e);
    return res.status(500).json({ error: "AI 일정 생성 실패" });
  }
});

export default router;
