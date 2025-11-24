import React from "react";
import Layout from "../../components/layout/Layout";
import "../../styles/page/Home.css";

export default function Home({ user, setUser, menuOpen, setMenuOpen }) {
  return (
    <Layout
      user={user}
      setUser={setUser}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
    >
      {/* HERO SECTION */}
      <section className="hero">
        <img
          src={`${process.env.PUBLIC_URL}/assets/images/main.jpg`}
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
    </Layout>
  );
}
