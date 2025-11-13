// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";

// 회원 가입 페이지 생성
import Register from "./Pages/Register"; 

/* 컴포넌트 링크, 여기는 더 추가할 예정*/
function Header() {
  return (
    <header>
      <div className="logo">Travel - chef</div>
      <nav>
        <ul>
          <li><Link to="/">홈</Link></li>
          <li><Link to="/tours">여행상품</Link></li>
          <li><Link to="/login">로그인</Link></li>
          <li><Link to="/register">회원가입</Link></li>
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
      <section className="hero">
        <h1>당신의 특별한 여행, T - chef와 함께</h1>
        <p>국내 맞춤형 여행 전문</p>

        <button className="btn" type="button" onClick={() => nav("/tours")}>
          지금 여행 상품 보기
        </button>
      </section>

      {/* 여행 카드들 */}
    </>
  );
}

/* 간단한 페이지들 */
function Tours() {
  return (
    <section className="tours">
      <h2>여행상품</h2>
    </section>
  );
}

function Login() {
  return (
    <section className="form">
      <h2>로그인</h2>
    </section>
  );
}

function Contact() {
  return (
    <section className="form">
      <h2>문의하기</h2>
    </section>
  );
}

/* Router */
export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tours" element={<Tours />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}