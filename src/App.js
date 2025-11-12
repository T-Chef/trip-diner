// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";

/* src/Components 컴포넌트 링크*/
function Header() {
  return (
    <header>
      <div className="logo">Travel - chef</div>
      <nav>
        <ul>
          <li><Link to="/">홈</Link></li>
          <li><Link to="/tours">여행상품</Link></li>
          <li><Link to="/login">로그인</Link></li>
          <li><Link to="/contact">문의하기</Link></li>
        </ul>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <p>비트교육센터</p>
    </footer>
  );
}

/* 메인 페이지 */
function Home() {
  const nav = useNavigate();
  return (
    <>
      {/* 메인 배너 */}
      <section className="hero">
        <h1>당신의 특별한 여행, T - chef와 함께</h1>
        <p>국내 맞춤형 여행 전문</p>
        {/* a href="#" 대신 버튼/Link 사용 */}
        <button className="btn" type="button" onClick={() => nav("/tours")}>
          지금 여행 상품 보기
        </button>
      </section>

      {/* 추천 여행지 일단 8개 배치 */}
      <section className="tours">
        <h2>추천 여행지</h2>
        <div className="tour-list">
          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/paris.jpg`} alt="파리 여행" />
            <h3>프랑스 파리</h3>
            <p>낭만의 도시에서 잊지 못할 추억을.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/jeju.jpg`} alt="제주 여행" />
            <h3>제주도 여행</h3>
            <p>자연과 함께하는 힐링 스테이.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/tokyo.jpg`} alt="도쿄 여행" />
            <h3>일본 도쿄</h3>
            <p>도시의 세련됨과 문화의 만남.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/bangkok.jpg`} alt="방콕 여행" />
            <h3>태국 방콕</h3>
            <p>이국적인 야시장과 맛의 도시.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/sydney.jpg`} alt="시드니 여행" />
            <h3>호주 시드니</h3>
            <p>자유로운 해변 도시의 매력.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/hanoi.jpg`} alt="하노이 여행" />
            <h3>베트남 하노이</h3>
            <p>고풍스러운 분위기와 거리 음식 천국.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/seoul.jpg`} alt="서울 여행" />
            <h3>한국 서울</h3>
            <p>전통과 현대가 어우러진 글로벌 도시.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/dubai.jpg`} alt="두바이 여행" />
            <h3>두바이</h3>
            <p>사막 위의 미래 도시, 럭셔리의 끝판왕.</p>
          </div>
        </div>
      </section>
    </>
  );
}

/* 로그인, 여행상품, 문의하기 임시로 만든 것, 추후 ai 페이지 추가 고려 */
function Tours() {
  return (
    <section className="tours">
      <h2>여행상품</h2>
      <p></p>
    </section>
  );
}
function Login() {
  return (
    <section className="form">
      <h2>로그인</h2>
      <p></p>
    </section>
  );
}
function Contact() {
  return (
    <section className="form">
      <h2>문의하기</h2>
      <p></p>
    </section>
  );
}

/* Router, 홈,여행상품,로그인,문의하기 창을 분리시킴. */
export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/tours" element={<Tours/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/contact" element={<Contact/>} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}