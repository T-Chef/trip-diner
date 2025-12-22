// front/src/hooks/useCityWeather.js
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "/api";

// 캐시/중복요청 방지
const _wxInflight = new Map(); // key -> Promise
const _wxCache = new Map();    // key -> { v, exp }
const TTL = 5 * 60 * 1000;     // 5분 캐시 (원하면 10분도 OK)

function getCache(key) {
  const hit = _wxCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    _wxCache.delete(key);
    return null;
  }
  return hit.v;
}

function isCanceled(err) {
  return err?.name === "CanceledError" || err?.code === "ERR_CANCELED";
}

async function fetchWeatherOnce(areaCode, signal) {
  const key = `wx|${areaCode || ""}`;

  const cached = getCache(key);
  if (cached) return cached;

  if (_wxInflight.has(key)) return _wxInflight.get(key);

  const p = (async () => {
    try {
      const res = await axios.get(`${API_BASE}/weather`, {
        params: { areaCode },
        signal,
        timeout: 8000,
      });
      // 백엔드 응답: { ok:true, weather, forecast, source }
      const v = {
        weather: res.data?.weather ?? null,
        forecast: res.data?.forecast ?? [],
        source: res.data?.source ?? "live",
      };
      _wxCache.set(key, { v, exp: Date.now() + TTL });
      return v;
    } finally {
      _wxInflight.delete(key);
    }
  })();

  _wxInflight.set(key, p);
  return p;
}

export default function useCityWeather(areaCode) {
  const code = useMemo(() => (areaCode != null ? Number(areaCode) : null), [areaCode]);

  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) {
      setWeather(null);
      setForecast([]);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchWeatherOnce(code, ctrl.signal);
        if (!alive) return;

        setWeather(data.weather);
        setForecast(data.forecast);
      } catch (err) {
        if (!alive) return;
        if (isCanceled(err) || ctrl.signal.aborted) return;

        // 백엔드가 {ok:false,message}로 줄 수도 있음
        const msg =
          err?.response?.data?.message ||
          "날씨 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
        setError(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [code]);

  return { weather, forecast, loading, error };
}
