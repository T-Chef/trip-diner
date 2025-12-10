import React, { useState } from "react";

// 올바른 경로
import Header from "../home/Header.jsx";
import SideMenu from "../home/SideMenu.jsx";

// city 컴포넌트
import { SearchBar, AIFilter, WeatherBox } from "../city";
import CityList from "../city/CityList.jsx";
import ReviewCard from "../city/ReviewCard.jsx";
import EventCard from "../city/EventCard.jsx";

// CSS 정확한 경로
import "../../styles/page/city/CityMain.css";

export default function CityMain({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const reviews = [
    {
      title: "제주 가족여행",
      summary: "2박 3일 일정으로 다녀온 여행 후기",
      userName: "홍길동",
    },
    {
      title: "부산 당일치기",
      summary: "맛집 위주로 다녀왔어요",
      userName: "김철수",
    },
  ];

  const events = [
    {
      title: "겨울 국내여행 할인 이벤트",
      desc: "양떼목장 · 스키장 · 온천 여행 최대 30% 할인!",
      thumb: "/images/event01.jpg",
    },
    {
      title: "제주도 렌터카 프로모션",
      desc: "선착순 할인 쿠폰 제공 · 하루 19,900원부터",
      thumb: "/images/event02.jpg",
    },
  ];

  const [filter, setFilter] = useState({
    areaCode: null,
    sigunguCode: null,
    keyword: "",
  });

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
          <WeatherBox />
        </div>

        <div className="floating-right">
          <AIFilter
            onFilterChange={(data) =>
              setFilter((prev) => ({ ...prev, ...data }))
            }
          />
        </div>

        <div className="city-content-box">
          <SearchBar
            onKeywordChange={(kw) =>
              setFilter((prev) => ({ ...prev, keyword: kw }))
            }
          />

          <div className="city-title-wrap">
            <h2 className="city-title">지금 가장 HOT🔥한 방문지 TOP 10</h2>
            <p className="city-subtitle">
              지난 일주일 간 평소보다 더 많이 저장된 관광지・맛집
            </p>
          </div>

          <div className="city-list-grid">
            {/* ⭐ user와 setUser 전달 */}
            <CityList filter={filter} user={user} setUser={setUser} />
          </div>

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
