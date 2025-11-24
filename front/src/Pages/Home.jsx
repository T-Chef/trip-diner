import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Home({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="wrapper">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo">Trip - Diner</div>
          </div>

          <div className="header-right">
            <button className="ham-btn" onClick={() => setMenuOpen(true)}>
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* SIDE MENU */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>
          ✕
        </button>

        <ul>
          {/* 로그인 / 로그아웃 */}
          {user ? (
            <>
              <li
                style={{
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontSize: "18px",
                }}
              >
                {user.name || user.username}님 환영합니다!
              </li>

              <li>
                <button onClick={handleLogout} className="logout-link">
                  로그아웃
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login">로그인 / 회원가입</Link>
            </li>
          )}

          {/* 나머지 메뉴 */}
          <li>
            <Link to="/tours">AI 일정표</Link>
          </li>

          <li>
            <Link to="/map">도시별 여행 지도</Link>
          </li>

          <li>
            <Link to="/board">게시판</Link>
          </li>

          <li>
            <Link to="/contact">문의하기</Link>
          </li>
        </ul>
      </div>

      {/* overlay */}
      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)}></div>
      )}

      {/* HERO SECTION */}
      <section className="hero">
        <img
          src={`${process.env.PUBLIC_URL}/images/main.jpg`}
          alt="메인배너"
          className="hero-img"
        />

        <div className="hero-content container">
          <h1 className="hero-title">
            BEGINNING OF <br /> TRAVEL
          </h1>
          <p className="hero-desc">
            숨겨진 여행지의 매력과 여유를 느껴보세요. <br />
            Trip - Diner 와 함께 특별한 순간을 만들어보세요.
          </p>
        </div>
      </section>

      {/* INTRO SECTION */}
      <section className="intro">
        <div className="container intro-inner">
          <p className="badge">일정 생성 • 관리</p>
          <h2 className="intro-title">
            나만의 여행 일정, <br />
            트립 디너로 간편해져요.
          </h2>
        </div>
      </section>

      {/* 추천상품 SECTION */}
      <section className="recommend">
        <div className="container">
          <h2 className="sec-title">추천 여행상품</h2>
          <p className="sec-desc">이번 시즌 인기 여행지</p>

          <div className="recommend-list">
            <div className="rec-card"></div>
            <div className="rec-card"></div>
            <div className="rec-card"></div>
          </div>
        </div>
      </section>

      {/* 리뷰 SECTION */}
      <section className="review">
        <div className="container">
          <h2 className="sec-title">고객 리뷰</h2>

          <div className="review-list">
            <div className="review-card">
              ⭐⭐⭐⭐⭐ <br />
              여행 일정도 좋고 정말 좋은 경험이었어요!
            </div>
            <div className="review-card">
              ⭐⭐⭐⭐⭐ <br />
              숙소도 깔끔하고 일정도 여유로웠어요!
            </div>
            <div className="review-card">
              ⭐⭐⭐⭐⭐ <br />
              부모님과 함께한 여행인데 만족도가 높았어요.
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">© 2025 Trip - Diner</footer>
    </div>
  );
}
