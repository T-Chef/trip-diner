import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import { searchPlaceByKeyword } from "../../apis/tourApi.js";
import { searchPlaceNaver } from "../../apis/naverApi.js";
import { generateDescription } from "../../apis/generateDescription.js";

/**
 * ✅ 동시성 제한 병렬 처리 유틸
 */
async function mapLimit(items, limit, mapper) {
  const results = [];
  let i = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await mapper(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * ✅ 같은 조건 재요청 캐시 (서버 재시작 시 초기화)
 */
const planCache = new Map();
const PLAN_CACHE_TTL_MS = 10 * 60 * 1000; // 10분
const planLockByIp = new Map();
function getClientKey(req) {
  const xff = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim();

  // express req.ip는 ::ffff:127.0.0.1 형태일 수 있음
  const ip = (xff || req.ip || req.socket?.remoteAddress || "unknown")
    .replace(/^::ffff:/, "");

  return ip;
}

/**
 * ✅ description 캐시 (lazy-load + prewarm)
 * key = name + "||" + address
 */
const descCache = new Map();
const DESC_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일 (원하면 1일로 줄여도 됨)

function getDescKey(name = "", address = "") {
  return `${String(name).trim()}||${String(address).trim()}`;
}

function getCachedDesc(key) {
  const hit = descCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  if (hit) descCache.delete(key);
  return null;
}

function setCachedDesc(key, value) {
  descCache.set(key, { value, expiresAt: Date.now() + DESC_CACHE_TTL_MS });
}

function shuffle(array) {
  return array
    .map((v) => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v);
}

/**
 * ✅ B) description lazy-load API
 * GET /api/ai/description?name=...&address=...
 */
router.get("/description", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const address = String(req.query.address || "").trim();

    if (!name) return res.status(400).json({ error: "name required" });

    const key = getDescKey(name, address);
    const cached = getCachedDesc(key);
    if (cached) return res.json({ description: cached, cached: true });

    // 실제 생성 (여기서만 await)
    const desc = await generateDescription(name, address);
    setCachedDesc(key, desc);

    return res.json({ description: desc, cached: false });
  } catch (e) {
    console.error("description 생성 오류:", e);
    return res.status(500).json({ error: "description 생성 실패" });
  }
});

router.post("/plan", async (req, res) => {
  const key = getClientKey(req);

  // ✅ 이미 생성 중이면 중복 요청 거부
  if (planLockByIp.get(key)) {
    return res.status(409).json({
      error: "추천 생성 중입니다. 완료될 때까지 잠시만 기다려주세요.",
    });
  }

  planLockByIp.set(key, true);

  // ✅ (선택) 혹시라도 요청이 영원히 안 끝나면 락이 안 풀리는 상황 대비
  const lockTTL = setTimeout(() => planLockByIp.delete(key), 120000); // 2분

  const reqId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  console.time(`[AI_PLAN_TOTAL] ${reqId}`);

  try {
    const { cityName, days, peopleType, themes, forceNew } = req.body;

    if (!cityName || !days || !peopleType || !themes?.length) {
      console.timeEnd(`[AI_PLAN_TOTAL] ${reqId}`);
      return res.status(400).json({ error: "요청 데이터 부족" });
    }

    // ✅ 캐시 조회 (반드시 라우터 안)
    const cacheKey = JSON.stringify({ cityName, days, peopleType, themes });
    if (!forceNew) {
  const cachedPlan = planCache.get(cacheKey);
  if (cachedPlan && cachedPlan.expiresAt > Date.now()) {
    console.timeEnd(`[AI_PLAN_TOTAL] ${reqId}`);
    return res.json({ aiPlan: cachedPlan.value, cached: true });
  }
}

    const themeKeywordMap = {
      먹방: ["맛집", "음식점", "고기집", "해산물", "식당"],
      힐링: ["공원", "산책로", "정원", "온천", "스파", "온천 스파", "한적한 해변", "자연"],
      액티비티: ["레저", "체험", "액티비티", "서핑", "카약", "패러글라이딩"],
      쇼핑: ["시장", "전통시장", "쇼핑몰", "아울렛"],
      문화: ["박물관", "미술관", "전시관", "공연장", "역사관"],
      자연: ["자연", "해변", "해수욕장", "폭포", "산", "호수", "전망대"],
      바다: ["바다", "해변", "해수욕장", "비치", "해안도로", "바다뷰 카페"],
      "산·자연": ["산", "숲길", "트레킹", "계곡", "폭포", "전망대"],
      "실내 여행지": ["실내", "아쿠아리움", "박물관", "미술관", "전시관", "키즈카페", "실내 테마파크", "쇼핑몰"],
      "문화·역사": ["문화재", "유적지", "사찰", "성당", "문화센터", "역사관"],
      전통시장: ["전통시장", "시장", "재래시장", "올레시장"],
      "카페·디저트": ["카페", "디저트", "베이커리", "브런치 카페"],
      "SNS 핫플": ["인스타 핫플", "포토스팟", "감성 카페", "뷰맛집"],
      "축제·공연": ["축제", "페스티벌", "불꽃축제", "야시장", "공연장"],
      "체험·액티비티": ["체험", "액티비티", "레저", "서핑", "카약", "패러글라이딩"],
    };

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

    const selectedThemeCategories = [
      ...new Set(themes.map((t) => themeCategoryMap[t]).filter(Boolean)),
    ];

    let placeCandidates = [];
    const candidateSeen = new Set();

    // ✅ 후보 장소 수집
    console.time(`[CANDIDATES] ${reqId}`);

    const tasks = [];
    for (const theme of themes) {
      // ✅ (선택) 호출 과다하면 키워드 상한 걸어도 됨
      // const keywords = (themeKeywordMap[theme] || [theme]).slice(0, 3);
      const keywords = (themeKeywordMap[theme] || [theme]).slice(0, 2);

      const category = themeCategoryMap[theme] || "etc";
      for (const keyword of keywords) tasks.push({ keyword, category });
    }

    // ✅ 동시성 3 (API 터지면 2로 더 내리기)
const results = await mapLimit(tasks, 3, async ({ keyword, category }) => {
  let tData = null;
  let nData = null;

  // ✅ TourAPI 먼저 (429 방지)
  try {
    tData = await searchPlaceByKeyword(keyword, cityName);
  } catch (e) {
    tData = null;
  }

  // ✅ TourAPI 숨 좀 쉬게
  await sleep(150);

  // ✅ Naver는 그 다음
  try {
    nData = await searchPlaceNaver(keyword, cityName);
  } catch (e) {
    nData = null;
  }

  // 기존 코드가 status를 기대하니까 형태 맞춰줌
  return {
    category,
    tData: tData
      ? { status: "fulfilled", value: tData }
      : { status: "rejected", reason: null },
    nData: nData
      ? { status: "fulfilled", value: nData }
      : { status: "rejected", reason: null },
  };
});

    for (const r of results) {
      const category = r.category;

      // ---- Tour 결과 ----
      if (r.tData.status === "fulfilled") {
        const tData = r.tData.value;
        if (Array.isArray(tData)) {
          for (const p of tData) {
  if (!p || !p.title || !p.lat || !p.lng) continue;

  const addr = String(p.addr1 || p.address || "").trim();
  if (!addr) continue; // ✅ 주소 없으면 스킵

  const key = `${p.title}-${addr}`;
  if (candidateSeen.has(key)) continue;
  candidateSeen.add(key);

  placeCandidates.push({
    ...p,
    address: addr,
    category,
  });
}
        } else if (tData && (tData.title || tData.name)) {
  const title = tData.title || tData.name;
  const address = String(tData.addr1 || tData.address || "").trim();

  // ✅ 주소 없으면 그냥 스킵 (continue 쓰지 말기)
  if (address) {
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
}

      }

// ---- Naver 결과 ----
if (r.nData.status === "fulfilled") {
  const nData = r.nData.value;

  if (Array.isArray(nData)) {
    for (const p of nData) {
      if (!p || !p.title || !p.lat || !p.lng) continue;

      const addr = String(p.roadAddress || p.addr1 || p.address || "").trim();
      if (!addr) continue;

      const key = `${p.title}-${addr}`;
      if (candidateSeen.has(key)) continue;
      candidateSeen.add(key);

      placeCandidates.push({
        ...p,
        address: addr,
        category,
      });
    }
  } else if (nData && nData.title) {
    const addr = String(nData.roadAddress || nData.addr1 || nData.address || "").trim();

    if (addr) {
      const key = `${nData.title}-${addr}`;
      if (!candidateSeen.has(key)) {
        candidateSeen.add(key);
        placeCandidates.push({
          ...nData,
          address: addr,
          category,
        });
      }
    }
  }
}
    }
    console.timeEnd(`[CANDIDATES] ${reqId}`);

    const regionKeyword = String(cityName || "").replace(/(특별시|광역시|자치시|시|도)$/g, "");

placeCandidates = placeCandidates
  .filter((p) => p && p.title && p.lat && p.lng)
  .filter((p) => p.address && String(p.address).trim().length > 0) // ✅ 주소 없는 후보 제거
  .filter((p) => {
    const addr = String(p.address || "");
    return addr.includes(regionKeyword) || addr.includes(String(cityName || ""));
  }) // ✅ 지역 필터 (한 번만)
  .filter((p, i, arr) => arr.findIndex((x) => x.title === p.title) === i); // ✅ 여기 세미콜론 필수

const bannedTitleRegex = /(PC방|pc방|피시방|피씨방|노래방|학원|고시원)/i;
placeCandidates = placeCandidates.filter((p) => !bannedTitleRegex.test(p.title));

// ✅ 최종 30개
placeCandidates = shuffle(placeCandidates).slice(0, 30);


    if (placeCandidates.length === 0) {
      console.timeEnd(`[AI_PLAN_TOTAL] ${reqId}`);
      return res.status(404).json({ error: "해당 도시/테마에 맞는 추천 장소가 없습니다." });
    }

    // ✅ A) 후보에 ID 부여 (1..N)
    const candidatesWithId = placeCandidates.map((p, idx) => ({
      ...p,
      _id: idx + 1,
    }));
    const candidateById = new Map(candidatesWithId.map((p) => [p._id, p]));

    // ✅ days에 따라 max_tokens 자동 계산 (ID 출력이라 훨씬 작아도 됨)
    const totalDays = Math.max(1, Number(days) || 1);
    const dynamicMaxTokens = Math.min(
      1400,
      Math.max(450, 200 + totalDays * 250)
    );

    // ✅ A) ID 기반 프롬프트 (토큰 절약)
    const candidateListCompact = candidatesWithId
      .map((p) => `${p._id}) ${p.title} | ${p.category || "etc"}`)
      .join("\n");

    const userPrompt = `
너는 대한민국 여행 플래너다.

[여행 기본 정보]
- 여행 도시: ${cityName}
- 일정: ${days}일
- 동행: ${peopleType}
- 선택된 테마: ${themes.join(", ")}
- 선택된 카테고리: ${selectedThemeCategories.join(", ") || "없음"}

[중요 규칙]
- 반드시 아래 "사용 가능한 후보 목록"에 있는 장소만 사용한다.
- 출력은 JSON만. 다른 텍스트 금지.
- places에는 반드시 후보의 "id"만 넣어라. (name/title 넣지 마라)
- 같은 id를 여러 날/여러 번 중복 사용하지 마라.
- 하루 4~6개.
- 동선이 너무 왔다 갔다 하지 않도록 비슷한 위치끼리 묶어라.
- 테마/카테고리는 일정 전체에 골고루 반영해라.
- market(전통시장)이 후보에 있고 테마에 전통시장이 있으면 최소 1개 포함해라.

[사용 가능한 후보 목록]
${candidateListCompact}

[응답 형식(JSON)]
{
  "title": "${cityName} 여행",
  "days": [
    {
      "day": 1,
      "places": [
        { "id": 1, "startTime": "09:00", "endTime": "11:00" }
      ]
    }
  ]
}
`;

    async function callOpenAI({ temperature, maxTokens }) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature,
        top_p: 0.95,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: "너는 최고의 여행 플래너다." },
          { role: "user", content: userPrompt },
        ],
      });

      let text = completion.choices[0].message.content?.trim() || "";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return text;
    }

    console.time(`[OPENAI_PLAN] ${reqId}`);

    let aiPlanRaw;
    try {
      aiPlanRaw = JSON.parse(
        await callOpenAI({ temperature: 0.9, maxTokens: dynamicMaxTokens })
      );
    } catch (e1) {
      console.warn(`[OPENAI_RETRY] ${reqId}`, e1?.message || e1);
      aiPlanRaw = JSON.parse(
        await callOpenAI({
          temperature: 0.6,
          maxTokens: Math.min(2000, dynamicMaxTokens + 500),
        })
      );
    }

    console.timeEnd(`[OPENAI_PLAN] ${reqId}`);

    // ✅ A) id -> 실제 장소정보로 치환
    const used = new Set();
    const daysArr = Array.isArray(aiPlanRaw?.days) ? aiPlanRaw.days : [];

    const aiPlan = {
      title: aiPlanRaw?.title || `${cityName} 여행`,
      days: daysArr
        .map((d) => ({
          day: Number(d?.day) || 1,
          places: Array.isArray(d?.places) ? d.places : [],
        }))
        .map((d) => ({
          ...d,
          places: d.places
            .map((p) => {
              const id = Number(p?.id);
              if (!id || !candidateById.has(id)) return null;
              if (used.has(id)) return null;
              used.add(id);

              const info = candidateById.get(id);
              return {
                // 원래 p의 시간 유지
                startTime: p.startTime || "09:00",
                endTime: p.endTime || "11:00",

                // 실제 장소정보 주입
                id,
                name: info.title,
                title: info.title,
                lat: info.lat > 1000 ? info.lat / 1e7 : info.lat,
                lng: info.lng > 1000 ? info.lng / 1e7 : info.lng,
                address: info.address || "",
                image: info.image ?? null,
                category: info.category ?? "etc",

                // ✅ B) description은 여기서 생성하지 않음
                description: null,
              };
            })
            .filter(Boolean),
        }))
        .filter((d) => d.places.length > 0),
    };

    // ✅ (기존 유지) 중복 제거 후 좌표 기준 재배치 로직
    //   - 이 로직이 품질을 흔들 수 있어서, 원하면 나중에 “원래 day구성 유지”로 바꿔줄 수도 있음.
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

      const totalDays2 = Number(days) || aiPlan.days.length || 1;
      const perDay = Math.ceil(allPlaces.length / totalDays2);

      const rebuiltDays = [];

      for (let d = 0; d < totalDays2; d++) {
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

        rebuiltDays.push({ day: d + 1, places: withTime });
      }

      aiPlan.days = rebuiltDays;
    }

    // ✅ 메타 추가
    aiPlan.cityName = cityName;
    aiPlan.daysCount = Number(days);
    aiPlan.peopleType = peopleType;
    aiPlan.themes = themes;

    // ✅ 캐시 저장 (응답 직전)
    planCache.set(cacheKey, {
      value: aiPlan,
      expiresAt: Date.now() + PLAN_CACHE_TTL_MS,
    });

    // ✅ B) description 캐시 “백그라운드 프리웜”(응답은 안 기다림)
    //    - 서버 성능/요금 부담되면 이 블록은 꺼도 됨.
    (async () => {
      try {
        const unique = [];
        const seenKey = new Set();

        for (const day of aiPlan.days || []) {
          for (const p of day.places || []) {
            if (!p?.name?.trim()) continue; 
            const key = getDescKey(p.name, p.address);
            if (seenKey.has(key)) continue;
            seenKey.add(key);

            // 이미 캐시에 있으면 스킵
            if (getCachedDesc(key)) continue;

            unique.push({ key, name: p.name, address: p.address });
          }
        }

        // 동시성 2~3 정도 추천 (너무 올리면 rate limit/요금 증가)
        await mapLimit(unique, 2, async (u) => {
            if (!u?.name?.trim()) return;  
          const desc = await generateDescription(u.name, u.address);
          setCachedDesc(u.key, desc);
        });
      } catch (e) {
        console.warn("desc prewarm 실패:", e?.message || e);
      }
    })();

    console.timeEnd(`[AI_PLAN_TOTAL] ${reqId}`);
    return res.json({ aiPlan, cached: false });
  } catch (err) {
    console.timeEnd(`[AI_PLAN_TOTAL] ${reqId}`);
    console.error("AI 일정 생성 오류:", err);
    return res.status(500).json({ error: "AI 일정 생성 실패" });
   } finally {
  clearTimeout(lockTTL);
  planLockByIp.delete(key);
}
});

export default router;