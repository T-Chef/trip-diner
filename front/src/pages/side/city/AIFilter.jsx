// src/components/city/AIFilter.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import "../../../styles/side/city/AIFilter.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

const isCanceled = (err) =>
  err?.name === "CanceledError" || err?.code === "ERR_CANCELED";

// ===============================
// ✅ Cities cache + inflight
// ===============================
const _citiesCache = new Map();
const _citiesInflight = new Map();
const CITIES_TTL = 5 * 60 * 1000;

function getCache(map, key) {
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    map.delete(key);
    return null;
  }
  return hit.v;
}

function acquireShared(key, inflightMap, cacheMap, makeRequest, ttlMs) {
  const cached = getCache(cacheMap, key);
  if (cached) {
    return { promise: Promise.resolve(cached), release: () => {} };
  }

  const existing = inflightMap.get(key);
  if (existing) {
    existing.refs += 1;
    return { promise: existing.promise, release: () => releaseShared(key, inflightMap) };
  }

  const ctrl = new AbortController();
  const entry = { ctrl, refs: 1, promise: null };

  entry.promise = (async () => {
    try {
      const v = await makeRequest(ctrl.signal);
      cacheMap.set(key, { v, exp: Date.now() + ttlMs });
      return v;
    } finally {
      inflightMap.delete(key);
    }
  })();

  inflightMap.set(key, entry);
  return { promise: entry.promise, release: () => releaseShared(key, inflightMap) };
}

function releaseShared(key, inflightMap) {
  const entry = inflightMap.get(key);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.ctrl.abort();
    inflightMap.delete(key);
  }
}

// ===============================
// ✅ Districts cache + inflight
// ===============================
const _districtCache = new Map();
const _districtInflight = new Map();
const DISTRICT_TTL = 60 * 1000;

export default function AIFilter({ value, onChange, onCitiesLoaded }) {
  const areaCode = value?.areaCode ?? null;
  const sigunguCode = value?.sigunguCode ?? null;

  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const DENSE3_AREAS = new Set([1, 31, 35, 36, 38]);
  const dense3 = DENSE3_AREAS.has(Number(areaCode)) && districts.length >= 14;

  useEffect(() => {
    let alive = true;

    const { promise, release } = acquireShared(
      "cities",
      _citiesInflight,
      _citiesCache,
      async (signal) => {
        const res = await axios.get(`${API_BASE}/tour/cities`, { signal });
        return res.data || [];
      },
      CITIES_TTL
    );

    (async () => {
      try {
        setLoadingCities(true);
        const list = await promise;
        if (!alive) return;
        setCities(list);

        onCitiesLoaded?.(list);
      } catch (e) {
        if (!alive) return;
        if (isCanceled(e)) return;
        console.error("⚠ 도시 목록 불러오기 실패:", e);
        setCities([]);
      } finally {
        if (alive) setLoadingCities(false);
      }
    })();

    return () => {
      alive = false;
      release();
    };
  }, [onCitiesLoaded]);

  useEffect(() => {
    if (!areaCode) {
      setDistricts([]);
      return;
    }

    let alive = true;
    setDistricts([]);

    const key = String(areaCode);
    const { promise, release } = acquireShared(
      key,
      _districtInflight,
      _districtCache,
      async (signal) => {
        const res = await axios.get(`${API_BASE}/tour/areas`, {
          params: { areaCode },
          signal,
        });
        return res.data || [];
      },
      DISTRICT_TTL
    );

    (async () => {
      try {
        setLoadingDistricts(true);
        const list = await promise;
        if (!alive) return;
        setDistricts(list);
      } catch (e) {
        if (!alive) return;
        if (isCanceled(e)) return;
        console.error("⚠ 시군구 목록 불러오기 실패:", e);
        setDistricts([]);
      } finally {
        if (alive) setLoadingDistricts(false);
      }
    })();

    return () => {
      alive = false;
      release();
    };
  }, [areaCode]);

  const handleCityClick = useCallback(
  (nextAreaCode) => {
    // ✅ 전체
    if (nextAreaCode == null) {
      onChange?.({ areaCode: null, sigunguCode: null });
      return;
    }
    // ✅ 도시 선택
    onChange?.({ areaCode: Number(nextAreaCode), sigunguCode: null });
  },
  [onChange]
);

  const handleAllDistrict = useCallback(() => {
    onChange?.({ sigunguCode: null });
  }, [onChange]);

  const handleDistrictClick = useCallback(
    (nextSigunguCode) => {
      onChange?.({ sigunguCode: Number(nextSigunguCode) });
    },
    [onChange]
  );

  const cityTags = useMemo(() => cities, [cities]);

  return (
    <div className="ai-filter-wrapper">
      <div className="ai-filter-city-tags">
        {loadingCities ? (
          <div className="city-loading">도시 불러오는 중...</div>
        ) : (
          <>
            {/* ✅ 전체 */}
            <div
              className={`city-tag ${areaCode == null ? "active" : ""}`}
              onClick={() => handleCityClick(null)}
            >
              #전체
            </div>

            {cityTags.map((city) => (
              <div
                key={city.areaCode}
                className={`city-tag ${
                  Number(city.areaCode) === Number(areaCode) ? "active" : ""
                }`}
                onClick={() => handleCityClick(city.areaCode)}
              >
                #{city.name}
              </div>
            ))}
          </>
        )}
      </div>


      {!!areaCode && (
        <div className={`ai-filter-district-grid ${dense3 ? "dense-3" : ""}`}>
          <div
            className={`district-tag ${sigunguCode == null ? "active" : ""}`}
            onClick={handleAllDistrict}
          >
            전체
          </div>

          {loadingDistricts ? (
            <div className="district-loading">불러오는 중...</div>
          ) : (
            districts.map((d) => (
              <div
                key={d.sigunguCode}
                className={`district-tag ${
                  Number(d.sigunguCode) === Number(sigunguCode) ? "active" : ""
                }`}
                onClick={() => handleDistrictClick(d.sigunguCode)}
              >
                {d.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
