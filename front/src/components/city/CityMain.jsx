import React, { useState } from "react";
import Header from "../home/Header";
import SideMenu from "../home/SideMenu";

import { SearchBar, AIFilter, WeatherBox } from ".";

import CityList from "./CityList";
import ReviewCard from "./ReviewCard";
import EventCard from "./EventCard";

import "../../styles/page/city/CityMain.css";

export default function CityMain({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const [filter, setFilter] = useState({
    areaCode: null,
    sigunguCode: null,
    keyword: ""
  });

  const handleKeywordChange = (value) => {
    setFilter(prev => ({ ...prev, keyword: value }));
  };

  const reviews = [
    { title: "제주 가족여행", summary: "2박 3일 일정으로 다녀온 여행 후기", userName: "홍길동" },
    { title: "부산 당일치기", summary: "맛집 위주로 다녀왔어요", userName: "김철수" }
  ];

  const events = [
    {
      title: "겨울 국내여행 할인 이벤트",
      desc: "양떼목장 · 스키장 · 온천 여행 최대 30% 할인!"
    },

    {
      title: "제주도 렌터카 프로모션",
      desc: "선착순 할인 쿠폰 제공 · 하루 19,900원부터"
    }
  ];

  

  return (
    <>
      {/* 헤더 */}
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />

      {/* 사이드 메뉴 */}
      <SideMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        setUser={setUser}
      />

      <div className="city-page-wrapper">

        {/* 왼쪽 날씨 – 화면에 떠 있는 패널 */}
        <div className="floating-left">
          <WeatherBox />
        </div>

        {/* 오른쪽 필터 – 화면에 떠 있는 패널 */}
        <div className="floating-right">
          <AIFilter onFilterChange={setFilter} />
        </div>

        {/* 중앙 메인 컨텐츠 */}
        <div className="city-content-box">

          {/* 검색바 */}
          <SearchBar onKeywordChange={handleKeywordChange} />

          {/* 타이틀 */}
          <div className="city-title-wrap">
            <h2 className="city-title">지금 가장 HOT🔥한 방문지 TOP 10</h2>
            <p className="city-subtitle">
              지난 일주일 간 평소보다 더 많이 저장된 관광지・맛집
            </p>
          </div>

          {/* 리스트 */}
          <div className="city-list-grid">
            <CityList filter={filter} />
          </div>

          {/* 후기 섹션 */}
          <section className="city-review-section">
            <div className="section-title">
              <h2>국내 실시간 여행기 🕒</h2>
              <p>직접 다녀온 추천 일정과 여행 꿀팁 확인하기</p>
            </div>

            <div className="review-list">
              {reviews.map((item, idx) => (
                <ReviewCard key={idx} item={item} />
              ))}
            </div>
          </section>

          {/* 이벤트 섹션 */}
          <section className="city-event-section">
            <div className="section-title">
              <h2>지금 진행 중인 이벤트 🎉</h2>
              <p>여행을 더 즐겁게 만드는 특별 혜택을 확인해보세요</p>
            </div>

            <div className="event-list">
              {events.map((item, idx) => (
                <EventCard key={idx} item={item} />
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
