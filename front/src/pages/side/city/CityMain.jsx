import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../../../components/home/Header.jsx";
import SideMenu from "../../../components/home/SideMenu.jsx";
import { SearchBar, AIFilter, WeatherBox } from ".";
import CityList from "./CityList";
import EventList from "./event/EventList.jsx";
import "../../../styles/side/city/CityMain.css";

import useCityWeather from "../../../hooks/useCityWeather.js"; 

const DEFAULT_AREA_CODE = 6;

// HTML 태그 제거 함수
const stripHtml = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

export default function CityMain({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate(); 
  const userId = user?.user_id ?? user?.id ?? user?.userId ?? null;

  const [latestPosts, setLatestPosts] = useState([]); 
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

  // 1. 후기 데이터 불러오기
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/posts/latest?areaCode=${filter.areaCode}`);
        setLatestPosts(res.data);
      } catch (err) {
        console.error("후기 데이터를 불러오지 못했습니다.", err);
      }
    };
    fetchLatestPosts();
  }, [filter.areaCode]); 

  // 2. URL 파라미터 동기화
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
      if (prev.areaCode === next.areaCode && prev.sigunguCode === next.sigunguCode && prev.keyword === next.keyword) return prev;
      return next;
    });
  }, [searchParams]);

  const syncToSearchParams = useCallback((patch) => {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      const before = sp.toString();
      const nextArea = patch.areaCode !== undefined ? patch.areaCode : filter.areaCode;
      const nextSigungu = patch.sigunguCode !== undefined ? patch.sigunguCode : filter.sigunguCode;
      const nextKeyword = patch.keyword !== undefined ? patch.keyword : filter.keyword;

      if (nextArea) sp.set("area", String(nextArea)); else sp.delete("area");
      if (nextSigungu) sp.set("sigungu", String(nextSigungu)); else sp.delete("sigungu");
      if (nextKeyword && nextKeyword.trim()) sp.set("keyword", nextKeyword.trim()); else sp.delete("keyword");

      if (before === sp.toString()) return prev;
      return sp;
    });
  }, [setSearchParams, filter.areaCode, filter.sigunguCode, filter.keyword]);

  const handleFilterChangeFromAIFilter = useCallback((patch) => {
    setFilter((prev) => {
      const next = { ...prev, ...patch };
      if (prev.areaCode === next.areaCode && prev.sigunguCode === next.sigunguCode && prev.keyword === next.keyword) return prev;
      return next;
    });
    syncToSearchParams(patch);
  }, [syncToSearchParams]);

  const keywordTimer = useRef(null);
  const handleKeywordChange = useCallback((value) => {
    const v = value ?? "";
    setFilter((prev) => (prev.keyword === v ? prev : { ...prev, keyword: v }));
    if (keywordTimer.current) clearTimeout(keywordTimer.current);
    keywordTimer.current = setTimeout(() => {
      syncToSearchParams({ keyword: v });
    }, 300);
  }, [syncToSearchParams]);

  const { weather, forecast, loading: weatherLoading } = useCityWeather(filter.areaCode);

  return (
    <>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
      <SideMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} setUser={setUser} />

      <div className="city-page-wrapper">
        <div className="floating-left">
          <WeatherBox weather={weather} forecast={forecast} />
          {weatherLoading && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>날씨 불러오는 중...</div>}
        </div>

        <div className="floating-right">
          <AIFilter value={{ areaCode: filter.areaCode, sigunguCode: filter.sigunguCode }} onChange={handleFilterChangeFromAIFilter} />
        </div>

        <div className="city-content-box">
          <div className="city-hero">
            <h2 className="city-head-title">도시 메뉴</h2>
            <p className="city-head-desc">지역을 고르고, 마음에 드는 여행지를 찜해서 나만의 코스를 만들어보세요.</p>
            <div className="city-hero-search"><SearchBar onKeywordChange={handleKeywordChange} /></div>
          </div>

          <section className="city-section">
            <h3 className="city-section-title">인기 여행지</h3>
            <div className="city-list-grid">
              <CityList areaCode={filter.areaCode} sigunguCode={filter.sigunguCode} keyword={filter.keyword} userId={userId} />
            </div>
          </section>

          {/* ⭐ 베스트 후기 섹션 */}
          <section className="city-section city-review-section">
            <div className="city-section-head center"><h3 className="city-section-title">지역 베스트 후기</h3></div>
            <div className="city-review-grid">
              {latestPosts.length > 0 ? (
                latestPosts.map((post) => (
                  <div 
                    key={post.post_id || post.id} 
                    className="city-post-card" 
                    // 🛠️ App.js 경로인 /board/:id 에 맞춰 수정 완료!
                    onClick={() => navigate(`/board/${post.post_id || post.id}`)} 
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="city-post-img" style={{ width: '100%', height: '200px', backgroundColor: '#eee', overflow: 'hidden' }}>
                      <img 
                    src={
                      post.image_url 
                        ? post.image_url.split(',')[0].startsWith('http') // 여러 장일 경우 첫 번째 것만 사용
                          ? post.image_url.split(',')[0] 
                          : `http://localhost:4000${post.image_url.split(',')[0]}`
                        : "https://picsum.photos/400/300?random=" + post.post_id // 사진 없으면 랜덤 이미지
                    } 
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          // ⚠️ 중요: 무한 루프 방지를 위해 onError가 실행되면 src를 비우거나 투명 이미지를 넣습니다.
                          e.target.onerror = null; 
                          e.target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // 투명한 1px 이미지
                          e.target.parentElement.style.backgroundColor = '#ddd'; // 대신 배경색을 칠함
                        }}
                      />
                    </div>
                    <div className="city-post-body">
                      <h4>{post.title}</h4>
                      <p>{stripHtml(post.content).substring(0, 60)}...</p>
                      <div className="city-post-footer">
                        <span>❤️ {post._count?.post_like || 0}</span> · <span>조회 {post.views}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="center">아직 이 지역의 후기가 없습니다.</p>
              )}
            </div>
          </section>

          <section className="city-event-section city-section">
            <h3 className="city-section-title">축제 · 이벤트</h3>
            <EventList areaCode={filter.areaCode} sigunguCode={filter.sigunguCode} />
          </section>
        </div>
      </div>
    </>
  );
}

