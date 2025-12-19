// back/routes/weather.js
import express from "express";
import axios from "axios";

const router = express.Router();

/**
 * ✅ ENV
 * - 서버에서는 REACT_APP_ 접두사 말고 서버용 키로 두는 게 좋아.
 * - .env에 아래 중 하나로 넣어줘:
 *   OPENWEATHER_API_KEY=xxxx
 *   WEATHER_API_KEY=xxxx
 */
const OPENWEATHER_KEY =
  process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY;

// areaCode -> cityName (OpenWeather q 값)
const AREA_CODE_TO_CITY = {
  1: "Seoul",
  2: "Incheon",
  3: "Daejeon",
  4: "Daegu",
  5: "Gwangju",
  6: "Busan",
  7: "Ulsan",
  8: "Sejong",
  31: "Suwon",
  32: "Gangneung",
  33: "Chungju",
  34: "Cheonan",
  35: "Gyeongju",
  36: "Changwon",
  37: "Jeonju",
  38: "Yeosu",
  39: "Jeju",
};

// ✅ 캐시 + in-flight(동시요청 dedupe)
const _wxCache = new Map(); // key -> { v, exp, staleExp }
const _wxInflight = new Map(); // key -> Promise

// TTL: 정상 캐시 10분 / 스테일(429일 때 fallback) 60분
const TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 60 * 60 * 1000;

function getCache(key) {
  const hit = _wxCache.get(key);
  if (!hit) return null;

  const now = Date.now();
  if (now <= hit.exp) return { type: "fresh", value: hit.v };

  // fresh는 만료됐지만 stale 기간이면 fallback 가능
  if (now <= hit.staleExp) return { type: "stale", value: hit.v };

  _wxCache.delete(key);
  return null;
}

function setCache(key, value) {
  const now = Date.now();
  _wxCache.set(key, {
    v: value,
    exp: now + TTL_MS,
    staleExp: now + STALE_TTL_MS,
  });
}

function normalizeCity({ city, areaCode }) {
  if (city && String(city).trim()) return String(city).trim();
  const code = areaCode != null ? Number(areaCode) : null;
  if (!code) return null;
  return AREA_CODE_TO_CITY[code] || null;
}

/**
 * GET /api/weather?areaCode=6
 * GET /api/weather?city=Busan
 */
router.get("/", async (req, res) => {
  try {
    if (!OPENWEATHER_KEY) {
      return res.status(500).json({
        ok: false,
        message:
          "OPENWEATHER_API_KEY(또는 WEATHER_API_KEY)가 서버 .env에 없습니다.",
      });
    }

    const city = normalizeCity(req.query);
    if (!city) {
      return res.status(400).json({
        ok: false,
        message: "city 또는 areaCode가 필요합니다. (예: ?areaCode=6)",
      });
    }

    const key = `wx|${city.toLowerCase()}`;

    // 1) fresh 캐시 있으면 즉시 반환
    const cached = getCache(key);
    if (cached?.type === "fresh") {
      res.set("Cache-Control", "public, max-age=60"); // 브라우저도 1분 정도 캐시
      return res.json({ ok: true, source: "cache", ...cached.value });
    }

    // 2) 동시 요청 dedupe
    if (_wxInflight.has(key)) {
      const value = await _wxInflight.get(key);
      res.set("Cache-Control", "public, max-age=60");
      return res.json({ ok: true, source: "inflight", ...value });
    }

    // 3) 실제 호출(2건: weather + forecast)
    const p = (async () => {
      const base = "https://api.openweathermap.org/data/2.5";
      const common = {
        q: city,
        appid: OPENWEATHER_KEY,
        units: "metric",
        lang: "kr",
      };

      const [cur, fc] = await Promise.all([
        axios.get(`${base}/weather`, { params: common, timeout: 8000 }),
        axios.get(`${base}/forecast`, { params: common, timeout: 8000 }),
      ]);

      const weather = {
        temp: Math.round(cur.data.main.temp),
        desc: cur.data.weather?.[0]?.description ?? "",
        icon: `https://openweathermap.org/img/w/${cur.data.weather?.[0]?.icon}.png`,
        city: cur.data.name,
      };

      const forecast = (fc.data.list || []).slice(0, 5);

      const value = { weather, forecast };
      setCache(key, value);
      return value;
    })();

    _wxInflight.set(key, p);

    try {
      const value = await p;
      res.set("Cache-Control", "public, max-age=60");
      return res.json({ ok: true, source: "live", ...value });
    } catch (err) {
      // ✅ 429면 stale 캐시가 있으면 그걸로 방어
      const status = err?.response?.status;
      const stale = getCache(key);

      if (status === 429 && stale?.value) {
        res.set("Cache-Control", "public, max-age=30");
        return res.status(200).json({
          ok: true,
          source: "stale-cache-429",
          ...stale.value,
          warning: "OpenWeather 429 → stale cache로 대체 반환",
        });
      }

      return res.status(status || 500).json({
        ok: false,
        message:
          err?.response?.data?.message ||
          err?.message ||
          "날씨 호출 중 오류가 발생했습니다.",
        status: status || 500,
      });
    } finally {
      _wxInflight.delete(key);
    }
  } catch (e) {
    console.error("weather route error:", e);
    return res.status(500).json({ ok: false, message: "서버 오류" });
  }
});

export default router;
