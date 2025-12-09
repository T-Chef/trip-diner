import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Header from "../home/Header";
import SideMenu from "../home/SideMenu";

import { SearchBar, AIFilter, WeatherBox } from ".";
import CityList from "./CityList";
import ReviewCard from "./ReviewCard";
import EventCard from "./EventCard";

import "../../styles/page/city/CityMain.css";

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

export default function CityMain({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const [filter, setFilter] = useState({
    areaCode: null,
    sigunguCode: null,
    keyword: "",
  });

  const [weather, setWeather] = useState(null); // 현재 날씨
  const [forecast, setForecast] = useState([]); // 3시간 예보
  const [useLocation] = useState(false); // 현재는 기본적으로 위치 기능 OFF

  const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

  /* ===========================================================
      🔥 도시 선택 -> 날씨 갱신
  =========================================================== */
  const fetchWeatherByCity = useCallback(
    async (city) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=kr`;
      const res = await axios.get(url);
      setWeather({
        temp: Math.round(res.data.main.temp),
        desc: res.data.weather[0].description,
        icon: `https://openweathermap.org/img/w/${res.data.weather[0].icon}.png`,
        city: res.data.name,
      });
    },
    [API_KEY]
  );

  /* ===========================================================
      🔥 2) fetchForecast (도시명 기반)
  =========================================================== */
  const fetchForecast = useCallback(
    async (city) => {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric&lang=kr`;
      const res = await axios.get(url);
      setForecast(res.data.list.slice(0, 5));
    },
    [API_KEY]
  );

  /* ===========================================================
      🔥 3) fetchWeatherByCoords (위도/경도 기반)
  =========================================================== */
  const fetchWeatherByCoords = useCallback(
    async (lat, lon) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
      const res = await axios.get(url);

      setWeather({
        temp: Math.round(res.data.main.temp),
        desc: res.data.weather[0].description,
        icon: `https://openweathermap.org/img/w/${res.data.weather[0].icon}.png`,
        city: res.data.name,
      });
    },
    [API_KEY]
  );

  /* ===========================================================
      🔥 4) fetchForecastByCoords (위도/경도 기반)
  =========================================================== */
  const fetchForecastByCoords = useCallback(
    async (lat, lon) => {
      const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
      const res = await axios.get(url);

      setForecast(res.data.list.slice(0, 5));
    },
    [API_KEY]
  );

  /* ===========================================================
      🔥 5) 선택한 도시 기준 날씨 불러오기
  =========================================================== */
  useEffect(() => {
    if (!filter.areaCode) return;

    const city = AREA_CODE_TO_CITY[filter.areaCode];
    if (!city) return;

    fetchWeatherByCity(city);
    fetchForecast(city);
  }, [filter.areaCode, fetchWeatherByCity, fetchForecast]);

  /* ===========================================================
      🔥 6) 현재 위치 기반 날씨
  =========================================================== */
  useEffect(() => {
    if (!useLocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        fetchWeatherByCoords(lat, lon);
        fetchForecastByCoords(lat, lon);
      },
      () => {
        console.warn("위치 권한 없음 → 도시 기본값 사용");
      }
    );
  }, [useLocation, fetchWeatherByCoords, fetchForecastByCoords]);

  /* ===========================================================
      🔥 7) 검색창 입력 처리
  =========================================================== */
  const handleKeywordChange = (value) => {
    setFilter((prev) => ({ ...prev, keyword: value }));
  };

  return (
    <>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />

      <SideMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} setUser={setUser} />

      <div className="city-page-wrapper">
        {/* 좌측 날씨 패널 */}
        <div className="floating-left">
          <WeatherBox weather={weather} forecast={forecast} />
        </div>

        {/* 우측 필터 패널 */}
        <div className="floating-right">
          <AIFilter onFilterChange={setFilter} />
        </div>

        {/* 중앙 컨텐츠 */}
        <div className="city-content-box">
          <SearchBar onKeywordChange={handleKeywordChange} />

          <div className="city-title-wrap">
            <h2 className="city-title">지금 가장 HOT🔥한 방문지 TOP 10</h2>
            <p className="city-subtitle">지난 일주일 간 평소보다 더 많이 저장된 관광지・맛집</p>
          </div>

          <div className="city-list-grid">
            <CityList filter={filter} />
          </div>

          {/* 후기 */}
          <section className="city-review-section">
            <div className="section-title">
              <h2>국내 실시간 여행기 🕒</h2>
              <p>직접 다녀온 추천 일정과 여행 꿀팁 확인하기</p>
            </div>

            <div className="review-list">
              <ReviewCard item={{ title: "제주 가족여행", summary: "2박 3일 일정 후기", userName: "홍길동" }} />
              <ReviewCard item={{ title: "부산 당일치기", summary: "맛집 위주!", userName: "김철수" }} />
            </div>
          </section>

          {/* 이벤트 */}
          <section className="city-event-section">
            <div className="section-title">
              <h2>지금 진행 중인 이벤트 🎉</h2>
              <p>여행을 더 즐겁게 만드는 특별 혜택을 확인해보세요</p>
            </div>

            <div className="event-list">
              <EventCard item={{ title: "겨울 여행 할인!", desc: "스키장, 온천 여행 최대 30% 할인" }} />
              <EventCard item={{ title: "제주 렌터카 프로모션", desc: "선착순 할인 쿠폰 제공" }} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
