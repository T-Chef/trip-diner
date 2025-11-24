import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/page/Home.jsx";
import Login from "./pages/page/Login.jsx";
import Signup from "./pages/page/Signup.jsx";
import Profile from "./pages/side/Profile.jsx";
import Schedule from "./pages/side/Schedule.jsx";
import City from "./pages/side/City.jsx";
import Board from "./pages/side/Board.jsx";
import Contract from "./pages/side/Contract.jsx";
import NotFound from "./pages/page/404.jsx";

export default function App() {
  // 로그인 사용자 상태
  const [user, setUser] = useState(null);

  // 사이드메뉴 상태
  const [menuOpen, setMenuOpen] = useState(false);

  // 새로고침 시 로그인 유지
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* 메인 */}
        <Route
          path="/"
          element={
            <Home
              user={user}
              setUser={setUser}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          }
        />

        {/* 로그인 */}
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* 회원가입 */}
        <Route path="/signup" element={<Signup />} />

        {/* 프로필 */}
        <Route
          path="/profile"
          element={
            <Profile
              user={user}
              setUser={setUser}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          }
        />

        {/* AI 일정표 */}
        <Route
          path="/schedule"
          element={
            <Schedule
              user={user}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          }
        />

        {/* 도시별 여행 지도 */}
        <Route
          path="/city"
          element={
            <City user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          }
        />

        {/* 게시판 */}
        <Route
          path="/board"
          element={
            <Board user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          }
        />

        {/* 문의하기 */}
        <Route
          path="/contract"
          element={
            <Contract
              user={user}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          }
        />

        {/* 404 페이지 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}