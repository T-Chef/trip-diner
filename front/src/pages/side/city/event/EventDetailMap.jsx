import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";
const NAVER_KEY = process.env.REACT_APP_NAVER_MAP_KEY || "1o7cfked5o";

// 네이버 지도 스크립트 로드 (중복 방지용)
let naverMapScriptPromise = null;
function loadNaverMapScript() {
  if (window.naver?.maps) return Promise.resolve(true);

  if (!naverMapScriptPromise) {
    naverMapScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-naver-map="1"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true));
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.dataset.naverMap = "1";
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_KEY}`;
      script.onload = () => resolve(true);
      script.onerror = (e) => reject(new Error("NAVER_MAP_SCRIPT_LOAD_FAILED"));
      document.head.appendChild(script);
    });
  }

  return naverMapScriptPromise;
}

// 이벤트 위치 보강용 enrich 캐시
const _enrichInflight = new Map();
const _enrichCache = new Map();
const ENRICH_TTL = 10 * 60 * 1000;

function getEnrichCache(key) {
  const hit = _enrichCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    _enrichCache.delete(key);
    return null;
  }
  return hit.v;
}

async function enrichOnce(title, address) {
  const key = `${(title || "").trim()}|${(address || "").trim()}`;

  const cached = getEnrichCache(key);
  if (cached) return cached;

  if (_enrichInflight.has(key)) return _enrichInflight.get(key);

  const p = (async () => {
    try {
      const res = await axios.get(`${API_BASE}/event/enrich`, {
        params: { title: title || "", address: address || "" },
      });
      _enrichCache.set(key, { v: res.data, exp: Date.now() + ENRICH_TTL });
      return res.data;
    } finally {
      _enrichInflight.delete(key);
    }
  })();

  _enrichInflight.set(key, p);
  return p;
}

export default function EventDetailMap({ title, address, mapX, mapY }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [pos, setPos] = useState({ lat: null, lng: null });
  const enrichInFlightRef = useRef(false);
  const enrichDoneKeyRef = useRef("");

  // 1. props로 좌표가 있으면 바로 세팅
  useEffect(() => {
    const lat = mapY ? Number(mapY) : null;
    const lng = mapX ? Number(mapX) : null;
    if (lat && lng) setPos({ lat, lng });
  }, [mapX, mapY]);

  // 2. 좌표가 없으면 title/address로 보강 시도
  useEffect(() => {
    let alive = true;

    const badTitle =
      !title ||
      String(title).includes("불러올 수 없습니다") ||
      String(title).includes("등록된 상세") ||
      String(title).includes("현재 상세 정보를");

    const safeTitle = (title || "").trim();
    const safeAddress = (address || "").trim();

    const fetchPos = async () => {
      if (pos.lat && pos.lng) return;
      if (badTitle && safeAddress.length < 2) return;
      if (!safeTitle && safeAddress.length < 2) return;

      const dedupKey = `${safeTitle}|${safeAddress}`;

      // 중복 요청 방지
      if (enrichInFlightRef.current) return;
      if (enrichDoneKeyRef.current === dedupKey) return;

      enrichInFlightRef.current = true;

      try {
        const data = await enrichOnce(safeTitle, safeAddress);

        const lat = data?.lat ? Number(data.lat) : null;
        const lng = data?.lng ? Number(data.lng) : null;

        enrichDoneKeyRef.current = dedupKey;

        if (alive && lat && lng) setPos({ lat, lng });
      } catch (e) {
        console.error("Naver MAP Error:", e);
      } finally {
        enrichInFlightRef.current = false;
      }
    };

    fetchPos();
    return () => {
      alive = false;
    };
  }, [pos.lat, pos.lng, title, address]);

  // 3. 네이버 지도 생성/업데이트
  useEffect(() => {
    if (!pos.lat || !pos.lng) return;

    let alive = true;

    const renderMap = async () => {
      try {
        await loadNaverMapScript();
        if (!alive || !window.naver?.maps || !mapElRef.current) return;

        const center = new window.naver.maps.LatLng(pos.lat, pos.lng);

        if (mapRef.current) {
          mapRef.current.setCenter(center);
          mapRef.current.setZoom(15);

          if (markerRef.current) {
            markerRef.current.setPosition(center);
            markerRef.current.setTitle(title || "이벤트 위치");
          } else {
            markerRef.current = new window.naver.maps.Marker({
              position: center,
              map: mapRef.current,
              title: title || "이벤트 위치",
            });
          }
          return;
        }

        mapRef.current = new window.naver.maps.Map(mapElRef.current, {
          center,
          zoom: 15,
        });

        markerRef.current = new window.naver.maps.Marker({
          position: center,
          map: mapRef.current,
          title: title || "이벤트 위치",
        });
      } catch (e) {
        console.error("Naver MAP Error:", e);
      }
    };

    renderMap();
    return () => {
      alive = false;
    };
  }, [pos.lat, pos.lng, title]);

  if (!pos.lat || !pos.lng) {
    return (
      <div className="pd-map pd-map-empty">
        위치 좌표 정보가 없어 지도를 표시할 수 없어요 🙏
      </div>
    );
  }

  return <div ref={mapElRef} className="pd-map" />;
}
