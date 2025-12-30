// CityMain.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import Header from "../../../components/home/Header.jsx";
import SideMenu from "../../../components/home/SideMenu.jsx";
import { SearchBar, AIFilter, WeatherBox } from ".";
import CityList from "./CityList";
import EventList from "./event/EventList.jsx";
import "../../../styles/side/city/CityMain.css";
import { useSearchParams } from "react-router-dom";


import useCityWeather from "../../../hooks/useCityWeather.js"; 

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
          <div className="city-hero">
            <div className="city-head-center">
              <h2 className="city-head-title">도시 메뉴</h2>
            </div>

            <p className="city-head-desc">
              지역을 고르고, 마음에 드는 여행지를 찜해서 나만의 코스를 만들어보세요.
            </p>

            <div className="city-hero-search">
              <SearchBar onKeywordChange={handleKeywordChange} />
            </div>
          </div>

          <section className="city-section">
          <div className="city-section-head center">
            <h3 className="city-section-title">인기 여행지</h3>
          </div>

          <p className="city-section-desc center">
            검색 + 찜(❤️)으로 빠르게 담아보세요.
          </p>

          <div className="city-list-grid">
            <CityList
              areaCode={filter.areaCode}
              sigunguCode={filter.sigunguCode}
              keyword={filter.keyword}
              userId={userId}
            />
          </div>
        </section>

        <section className="city-event-section city-section">
            <div className="city-section-head center">
              <h3 className="city-section-title">축제 · 이벤트</h3>
            </div>

            <p className="city-section-desc center">
              지금 진행 중인 행사만 모아봤어요.
            </p>

            <div className="event-topline" aria-hidden="true" />

            <EventList areaCode={filter.areaCode} sigunguCode={filter.sigunguCode} />
          </section>
        </div>
      </div>
    </>
  );
}
