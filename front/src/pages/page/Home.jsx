import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/page/Home.css";

// 분리한 SideMenu 가져오기
import SideMenu from "../../components/side/SideMenu.jsx";

export default function Home({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const sectionsRef = useRef([]);
  const heroRef = useRef(null);

  // 섹션 애니메이션
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("show");
          else entry.target.classList.remove("show");
        });
      },
      { threshold: 0.5, rootMargin: "-50px 0px" }
    );

    sectionsRef.current.forEach((sec) => sec && observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  // 히어로 텍스트 애니메이션
  useEffect(() => {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("show");
        });
      },
      { threshold: 0.4 }
    );

    if (heroRef.current) heroObserver.observe(heroRef.current);
    return () => heroObserver.disconnect();
  }, []);

  const categories = [
    "체험, 활동적",
    "유명 관광지",
    "여유롭게 힐링",
    "문화, 예술, 역사",
    "관광보다 맛집",
  ];

  const [selectedCategories, setSelectedCategories] = useState([]);

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <div className="home-wrapper">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">Trip - Diner</div>

          {/* 메뉴가 닫혀 있을 때만 햄버거 버튼 표시 */}
          {!menuOpen && (
            <button className="ham-btn" onClick={() => setMenuOpen(true)}>
              ☰
            </button>
          )}
        </div>
      </header>

      {/* SIDE MENU */}
      <SideMenu
        user={user}
        setUser={setUser}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {/* HERO */}
      <section className="hero">
        <img
          src="/assets/images/main.png"
          className="hero-img"
          alt="메인 배너"
        />

        <div className="hero-content" ref={heroRef}>
          <h1 className="hero-title">
            보는 순간 설레는
            <br />
            여행 메뉴판
          </h1>
          <p className="hero-desc">
            당신의 취향을 맛보고 만드는 여행 코스
            <br />
            Trip-Diner와 함께 특별한 여행을 시작하세요
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section
        className="section-box intro-section"
        ref={(el) => (sectionsRef.current[0] = el)}
      >
        <p className="badge">일정 생성 · 관리</p>
        <h2 className="intro-title">
          내가 가고 싶은 여행 테마,
          <br />
          T-chef로 간편하게
        </h2>

        <ul className="intro-list">
          <li>✔ 다녀온 사람들의 후기</li>
          <li>✔ 나의 스타일을 맞춰주는 여행</li>
          <li>✔ 후기 공유하는 게시판</li>
          <li>✔ 각 지역의 이벤트도 한눈에</li>
        </ul>
      </section>

      {/* 추천 여행지 */}
      <section
        className="section-box recommend-section"
        ref={(el) => (sectionsRef.current[1] = el)}
      >
        <h2 className="sec-title">추천 여행지</h2>

        <div className="recommend-cards">
          <div className="rec-item">
            <div className="rec-number">1</div>
            <div className="rec-content">
              <h3>구로몬 시장</h3>
              <p>다양한 먹거리가 있는 '오사카의 부엌'</p>
            </div>
          </div>

          <div className="rec-item">
            <div className="rec-number">2</div>
            <div className="rec-content">
              <h3>나카자키초</h3>
              <p>사진 찍기 좋은 인기 스팟</p>
            </div>
          </div>

          <div className="rec-item">
            <div className="rec-number">3</div>
            <div className="rec-content">
              <h3>텐진바시스지 상점가</h3>
              <p>다양한 아케이드형 상점 거리</p>
            </div>
          </div>
        </div>
      </section>

      {/* 취향 선택 */}
      <section
        className="section-box taste-section"
        ref={(el) => (sectionsRef.current[2] = el)}
      >
        <h3 className="taste-title">내가 선호하는 여행 스타일은?</h3>
        <p className="small">다중 선택이 가능해요</p>

        <div className="chip-box">
          {categories.map((c) => (
            <button
              key={c}
              className={selectedCategories.includes(c) ? "selected" : ""}
              onClick={() => toggleCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="sample-card">
          <div className="img-box"></div>
          <div className="sample-card-right">
            <h4>부산, 3박 4일 여행 완성</h4>
            <p>T-chef가 알려준 맞춤 일정으로 떠나보세요.</p>
          </div>
        </div>
      </section>

      <footer className="footer">© 2025 Trip - Diner</footer>
    </div>
  );
}
