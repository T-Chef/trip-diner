// src/components/city/CityList.jsx
import React, { useEffect, useMemo, useState } from "react";
import CityListItem from "./CityListItem";
import axios from "axios";
import "../../styles/page/city/CityList.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

// ✅ TTL cache
const _placeCache = new Map(); // key -> { v, exp }
const PLACE_TTL = 10 * 1000; // 개발용 10초(429/부하 많으면 30~60초 추천)

// ✅ refCount 기반 inflight 공유(AbortController 공유)
const _placeInflight = new Map(); // key -> { ctrl, promise, refs }

const isCanceled = (err) =>
  err?.name === "CanceledError" || err?.code === "ERR_CANCELED";

function getPlaceCache(key) {
  const hit = _placeCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    _placeCache.delete(key);
    return null;
  }
  return hit.v;
}

function normalizePlaceResponse(raw) {
  let list = [];
  let message = null;

  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && Array.isArray(raw.data)) {
    list = raw.data;
    if (raw.message) message = raw.message;
  } else if (raw && raw.ok === false) {
    message = raw.message || "여행지 목록을 가져오는 중 문제가 발생했습니다.";
    list = Array.isArray(raw.data) ? raw.data : [];
  } else {
    message = "여행지 데이터를 해석하지 못했어요.";
    list = [];
  }

  return { list, message };
}

/**
 * ✅ acquire: 같은 key 요청을 1번만 보내고, refs++로 공유
 * - 캐시가 있으면 즉시 resolve + release no-op
 * - inflight가 있으면 그 promise를 공유
 * - 새로 만들면 AbortController도 공유
 */
function acquirePlacesRequest(key, makeRequest) {
  const cached = getPlaceCache(key);
  if (cached) {
    return {
      promise: Promise.resolve(cached),
      release: () => {},
    };
  }

  const existing = _placeInflight.get(key);
  if (existing) {
    existing.refs += 1;
    return {
      promise: existing.promise,
      release: () => releasePlacesRequest(key),
    };
  }

  const ctrl = new AbortController();

  const entry = {
    ctrl,
    refs: 1,
    promise: null,
  };

  entry.promise = (async () => {
    try {
      const normalized = await makeRequest(ctrl.signal);
      _placeCache.set(key, { v: normalized, exp: Date.now() + PLACE_TTL });
      return normalized;
    } finally {
      // 요청이 끝나면 inflight 정리(refs가 남아있어도 promise는 각자가 들고 있음)
      _placeInflight.delete(key);
    }
  })();

  _placeInflight.set(key, entry);

  return {
    promise: entry.promise,
    release: () => releasePlacesRequest(key),
  };
}

/**
 * ✅ release: refs--, 0이면 abort
 */
function releasePlacesRequest(key) {
  const entry = _placeInflight.get(key);
  if (!entry) return;

  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.ctrl.abort();
    _placeInflight.delete(key);
  }
}

export default function CityList({ areaCode, sigunguCode, keyword }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const safeKeyword = useMemo(() => (keyword ?? "").trim(), [keyword]);

  useEffect(() => {
    if (!areaCode) {
      setPlaces([]);
      setErrorMsg(null);
      return;
    }

    let alive = true;

    const key = `place/places|${areaCode || ""}|${sigunguCode || ""}|${safeKeyword || ""}`;

    const { promise, release } = acquirePlacesRequest(key, async (signal) => {
      const res = await axios.get(`${API_BASE}/place/places`, {
        params: { areaCode, sigunguCode, keyword: safeKeyword ?? "" },
        signal,
      });
      return normalizePlaceResponse(res.data);
    });

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { list, message } = await promise;
        if (!alive) return;

        if (message) setErrorMsg(message);
        setPlaces(list.slice(0, 10));
      } catch (err) {
        if (!alive) return;
        if (isCanceled(err)) return; // ✅ abort/취소는 정상 흐름

        console.error("🔥 관광지 목록 로드 실패:", err);
        setErrorMsg(
          err.response?.data?.message ||
            "지금 여행지 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
        );
        // ✅ 실패해도 기존 places 유지
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      release(); // ✅ refs--, 필요시 abort
    };
  }, [areaCode, sigunguCode, safeKeyword]);

  if (!areaCode) {
    return (
      <div className="city-list-empty">
        지역을 선택하면 인기 많은 여행지를 보여드릴게요.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="city-list-grid">
        <div className="city-list-left">
          {Array.from({ length: 5 }).map((_, idx) => (
            <CityListItem key={`sk-left-${idx}`} index={idx + 1} isSkeleton />
          ))}
        </div>
        <div className="city-list-right">
          {Array.from({ length: 5 }).map((_, idx) => (
            <CityListItem key={`sk-right-${idx}`} index={idx + 6} isSkeleton />
          ))}
        </div>
      </div>
    );
  }

  if (!places.length) {
    return (
      <div className="city-list-empty">
        {errorMsg ? (
          <>
            {errorMsg}
            <br />
            다른 지역이나 키워드로 다시 시도해 주세요.
          </>
        ) : (
          <>
            이 지역에 아직 보여줄 여행지가 없어요.
            <br />
            다른 도시나 키워드로 검색해볼까요?
          </>
        )}
      </div>
    );
  }

  return (
    <div className="city-list-grid">
      <div className="city-list-left">
        {places.slice(0, 5).map((p, idx) => (
          <CityListItem key={p.contentId} index={idx + 1} item={p} />
        ))}
      </div>

      <div className="city-list-right">
        {places.slice(5, 10).map((p, idx) => (
          <CityListItem key={p.contentId} index={idx + 6} item={p} />
        ))}
      </div>
    </div>
  );
}
