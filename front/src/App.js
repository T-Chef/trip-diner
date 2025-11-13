// src/App.js
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import "./App.css";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx"; // 회원가입 페이지
import Admin from "./Pages/Admin.jsx";

function Header({ user, setUser }) {
  const navigate = useNavigate();
  // 로그아웃 기능
  const handleLogout = () => {
    setUser(null); // 사용자 상태 초기화
    navigate("/"); // 홈으로 이동
  };

/* 컴포넌트 링크, 여기는 더 추가할 예정*/
return (
    <header>
      <div className="logo">Travel - chef</div>
      <nav>
        <ul>
          <li><Link to="/">홈</Link></li>
          <li><Link to="/tours">AI추천</Link></li>
          <li><Link to="/contact">문의하기</Link></li>
          {user ? (
            <>
              <li><span>{user.name}님 환영합니다!</span></li>
              <li>
                <button onClick={handleLogout} style={{ border: "none", background: "none", cursor: "pointer" }}>
                  로그아웃
                </button>
              </li>
            </>
          ) : (
            <li><Link to="/login">로그인</Link></li>
          )}
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

      {/* 여행 카드들은 일단 삭제 */}
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

function Contact() {
  return (
    <section className="form">
      <h2>문의하기</h2>
    </section>
  );
}

/* Router */
export default function App() {
  //삭제 예정
  const [user, setUser] = useState(null); //로그인 사용자 상태
  const [dummyUsers, setDummyUsers] = useState([
     { email: "whtjgml2002@naver.com", password: "1234", name: "조서희" },
     { email: "dooly@gmail.com", password: "1111", name: "둘리" },
     { email: "admin@gmail.com", password: "0000", name: "관리자" } // 관리자 계정
  ]);
 
return (
    <BrowserRouter>
      <Header user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/tours" element={<Tours/>} />
        <Route path="/login" element={<Login setUser={setUser} dummyUsers={dummyUsers} />} />
        <Route path="/signup" element={<Signup dummyUsers={dummyUsers} setDummyUsers={setDummyUsers} />} />
        <Route path="/contact" element={<Contact/>} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}