// CityMain.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "../../../components/home/Header.jsx";
import SideMenu from "../../../components/home/SideMenu.jsx";
import { SearchBar, AIFilter, WeatherBox } from ".";
import CityList from "./CityList";
import EventList from "./event/EventList.jsx";
import "../../../styles/side/city/CityMain.css";
import { useSearchParams } from "react-router-dom";

// ✅ 추가
import useCityWeather from "../../../hooks/useCityWeather.js"; 
// ↑ 너 폴더 위치에 맞춰 경로 조정 필요
// 예: CityMain이 front/src/pages/city/CityMain.jsx면 hooks는 front/src/hooks/.. 이므로
// "../../hooks/useCityWeather" 가 맞는 경우가 많아

const DEFAULT_AREA_CODE = 6;

export default function CityMain({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = user?.user_id ?? user?.id ?? user?.userId ?? null;

  const [filter, setFilter] = useState(() => {
    const areaParam = searchParams.get("area");
    const sigunguParam = searchParams.get("sigungu");
    const keywordParam = searchParams.get("keyword");

    return {
      areaCode: areaParam ? Number(areaParam) : DEFAULT_AREA_CODE,
      sigunguCode: sigunguParam ? Number(sigunguParam) : null,
      keyword: keywordParam || "",
    };
  });

  // ✅ URL → filter 동기화
  useEffect(() => {
    const areaParam = searchParams.get("area");
    const sigunguParam = searchParams.get("sigungu");
    const keywordParam = searchParams.get("keyword");

    const next = {
      areaCode: areaParam ? Number(areaParam) : DEFAULT_AREA_CODE,
      sigunguCode: sigunguParam ? Number(sigunguParam) : null,
      keyword: keywordParam || "",
    };

    setFilter((prev) => {
      if (
        prev.areaCode === next.areaCode &&
        prev.sigunguCode === next.sigunguCode &&
        prev.keyword === next.keyword
      ) return prev;
      return next;
    });
  }, [searchParams]);

  // ✅ filter → URL 동기화 helper
  const syncToSearchParams = useCallback(
    (patch) => {
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        const before = sp.toString();

        const nextArea =
          patch.areaCode !== undefined ? patch.areaCode : filter.areaCode;
        const nextSigungu =
          patch.sigunguCode !== undefined ? patch.sigunguCode : filter.sigunguCode;
        const nextKeyword =
          patch.keyword !== undefined ? patch.keyword : filter.keyword;

        if (nextArea) sp.set("area", String(nextArea));
        else sp.delete("area");

        if (nextSigungu) sp.set("sigungu", String(nextSigungu));
        else sp.delete("sigungu");

        if (nextKeyword && nextKeyword.trim()) sp.set("keyword", nextKeyword.trim());
        else sp.delete("keyword");

        if (before === sp.toString()) return prev;
        return sp;
      });
    },
    [setSearchParams, filter.areaCode, filter.sigunguCode, filter.keyword]
  );

  // ✅ AIFilter value/onChange 구조
  const handleFilterChangeFromAIFilter = useCallback(
    (patch) => {
      setFilter((prev) => {
        const next = { ...prev, ...patch };
        if (
          prev.areaCode === next.areaCode &&
          prev.sigunguCode === next.sigunguCode &&
          prev.keyword === next.keyword
        ) return prev;
        return next;
      });
      syncToSearchParams(patch);
    },
    [syncToSearchParams]
  );

  // ✅ keyword debounce
  const keywordTimer = useRef(null);
  const handleKeywordChange = useCallback(
    (value) => {
      const v = value ?? "";
      setFilter((prev) => (prev.keyword === v ? prev : { ...prev, keyword: v }));

      if (keywordTimer.current) clearTimeout(keywordTimer.current);
      keywordTimer.current = setTimeout(() => {
        syncToSearchParams({ keyword: v });
      }, 300);
    },
    [syncToSearchParams]
  );

  useEffect(() => {
    return () => {
      if (keywordTimer.current) clearTimeout(keywordTimer.current);
    };
  }, []);

  // ✅✅✅ 날씨: 백엔드(/api/weather)만 호출
  const { weather, forecast, loading: weatherLoading, error: weatherError } =
    useCityWeather(filter.areaCode);

  return (
    <>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
      <SideMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        setUser={setUser}
      />

      <div className="city-page-wrapper">
        <div className="floating-left">
          <WeatherBox weather={weather} forecast={forecast} />
          {weatherLoading && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              날씨 불러오는 중...
            </div>
          )}
          {weatherError && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
              {weatherError}
            </div>
          )}
        </div>

        <div className="floating-right">
          <AIFilter
            value={{ areaCode: filter.areaCode, sigunguCode: filter.sigunguCode }}
            onChange={handleFilterChangeFromAIFilter}
          />
        </div>

        <div className="city-content-box">
          <SearchBar onKeywordChange={handleKeywordChange} />

          <div className="city-list-grid">
            <CityList
              areaCode={filter.areaCode}
              sigunguCode={filter.sigunguCode}
              keyword={filter.keyword}
              userId={userId}
            />
          </div>

          <section className="city-event-section">
            <EventList areaCode={filter.areaCode} sigunguCode={filter.sigunguCode} />
          </section>
        </div>
      </div>
    </>
  );
}
