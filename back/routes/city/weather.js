import express from "express";
import axios from "axios";

const router = express.Router();

// OpenWeather API Key
const OPENWEATHER_KEY =
  process.env.OPENWEATHER_API_KEY || process.env.WEATHER_API_KEY;

const AREA_CODE_TO_CITY = {
  1: { q: "Seoul,KR", ko: "서울" },
  2: { q: "Incheon,KR", ko: "인천" },
  3: { q: "Daejeon,KR", ko: "대전" },
  4: { q: "Daegu,KR", ko: "대구" },
  5: { q: "Gwangju,KR", ko: "광주" },
  6: { q: "Busan,KR", ko: "부산" },
  7: { q: "Ulsan,KR", ko: "울산" },
  8: { q: "Sejong,KR", ko: "세종" },
  31: { q: "Suwon,KR", ko: "수원" },
  32: { q: "Gangneung,KR", ko: "강릉" },
  33: { q: "Chungju,KR", ko: "충주" },
  34: { q: "Cheonan,KR", ko: "천안" },
  35: { q: "Gyeongju,KR", ko: "경주" },
  36: { q: "Changwon,KR", ko: "창원" },
  37: { q: "Jeonju,KR", ko: "전주" },
  38: { q: "Yeosu,KR", ko: "여수" },
  39: { q: "Jeju City,KR", ko: "제주" },
};

// overview에서 보여줄 주요 지역
const OVERVIEW_AREAS = [1, 2, 6, 4, 5, 39];
const _wxCurCache = new Map();
const _wxCurInflight = new Map();

const CUR_TTL_MS = 10 * 60 * 1000;
const CUR_STALE_TTL_MS = 60 * 60 * 1000;

function getCurCache(key) {
  const hit = _wxCurCache.get(key);
  if (!hit) return null;

  const now = Date.now();
  if (now <= hit.exp) return { type: "fresh", value: hit.v };
  if (now <= hit.staleExp) return { type: "stale", value: hit.v };

  _wxCurCache.delete(key);
  return null;
}

function setCurCache(key, value) {
  const now = Date.now();
  _wxCurCache.set(key, {
    v: value,
    exp: now + CUR_TTL_MS,
    staleExp: now + CUR_STALE_TTL_MS,
  });
}

async function fetchCurrentOnly(cityObj) {
  const base = "https://api.openweathermap.org/data/2.5";
  const common = {
    q: cityObj.q,
    appid: OPENWEATHER_KEY,
    units: "metric",
    lang: "kr",
  };

  const cur = await axios.get(`${base}/weather`, { params: common, timeout: 8000 });

  return {
    areaCode: cityObj.areaCode,
    city: cityObj.ko || cur.data.name,
    temp: Math.round(cur.data.main.temp),
    desc: cur.data.weather?.[0]?.description ?? "",
    icon: `https://openweathermap.org/img/w/${cur.data.weather?.[0]?.icon}.png`,
  };
}

const _wxCache = new Map();
const _wxInflight = new Map();
const TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 60 * 60 * 1000;

function getCache(key) {
  const hit = _wxCache.get(key);
  if (!hit) return null;

  const now = Date.now();
  if (now <= hit.exp) return { type: "fresh", value: hit.v };

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

  if (city && String(city).trim()) {
    const c = String(city).trim();
    return { q: c, ko: c };
  }

  const code = areaCode != null ? Number(areaCode) : null;
  if (!code) return null;

  return AREA_CODE_TO_CITY[code] || null;
}

router.get("/overview", async (req, res) => {
  try {
    if (!OPENWEATHER_KEY) {
      return res.status(500).json({
        ok: false,
        message: "OPENWEATHER_API_KEY(또는 WEATHER_API_KEY)가 서버 .env에 없습니다.",
      });
    }

    const results = await Promise.all(
      OVERVIEW_AREAS.map(async (ac) => {
        const base = AREA_CODE_TO_CITY[ac];
        if (!base) return null;

        const cityObj = { ...base, areaCode: ac };
        const key = `wxcur|${String(cityObj.q).trim().toLowerCase().replace(/\s+/g, "_")}`;

        // 1) fresh cache
        const cached = getCurCache(key);
        if (cached?.type === "fresh") return cached.value;

        // 2) inflight dedupe
        if (_wxCurInflight.has(key)) {
          try {
            return await _wxCurInflight.get(key);
          } catch (e) {
            _wxCurInflight.delete(key);
            throw e;
          }
        }

        const p = (async () => {
          const value = await fetchCurrentOnly(cityObj);
          setCurCache(key, value);
          return value;
        })();

        _wxCurInflight.set(key, p);

        try {
          return await p;
        } catch (err) {
          const status = err?.response?.status;
          const stale = getCurCache(key);

          if (status === 429 && stale?.value) return stale.value;
          return null;
        } finally {
          _wxCurInflight.delete(key);
        }
      })
    );

    const list = results.filter(Boolean);
    res.set("Cache-Control", "public, max-age=60");
    return res.json({ ok: true, list });
  } catch (e) {
    console.error("weather overview error:", e);
    return res.status(500).json({ ok: false, message: "서버 오류" });
  }
});

router.get("/", async (req, res) => {
  try {
    if (!OPENWEATHER_KEY) {
      return res.status(500).json({
        ok: false,
        message:
          "OPENWEATHER_API_KEY(또는 WEATHER_API_KEY)가 서버 .env에 없습니다.",
      });
    }

    const cityObj = normalizeCity(req.query);
    if (!cityObj) {
      return res.status(400).json({ ok:false, message:"city 또는 areaCode 필요" });
    }

    const key = `wx|${String(cityObj.q || cityObj.ko)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")}`;

    // 1) fresh 캐시 있으면 즉시 반환
    const cached = getCache(key);
    if (cached?.type === "fresh") {
      res.set("Cache-Control", "public, max-age=60");
      return res.json({ ok: true, source: "cache", ...cached.value });
    }

    // 2) 동시 요청 dedupe
    if (_wxInflight.has(key)) {
      try {
        const value = await _wxInflight.get(key);
        res.set("Cache-Control", "public, max-age=60");
        return res.json({ ok: true, source: "inflight", ...value });
      } catch (e) {
        _wxInflight.delete(key);
        throw e;
      }
    }

    // 3) 실제 호출(2건: weather + forecast)
    const p = (async () => {
    const base = "https://api.openweathermap.org/data/2.5";
    const common = {
      q: cityObj.q,
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
      city: cityObj.ko || cur.data.name,
    };

      const tzSec = fc.data.city?.timezone ?? 0;

      // "도시 기준 오늘" 로 출력할 수 있게 필터링
      const nowLocal = new Date(Date.now() + tzSec * 1000);
      const y = nowLocal.getUTCFullYear();
      const m = nowLocal.getUTCMonth();
      const d = nowLocal.getUTCDate();

      const slots = new Set([6, 9, 12, 15, 18, 21]);

      const forecast = (fc.data.list || []).filter((item) => {
      const dtLocal = new Date((item.dt + tzSec) * 1000);
      const sameDay =
        dtLocal.getUTCFullYear() === y &&
        dtLocal.getUTCMonth() === m &&
        dtLocal.getUTCDate() === d;

      const hour = dtLocal.getUTCHours();
      return sameDay && slots.has(hour);
    });
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