import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Navigate } from "react-router-dom";


// 기존 페이지
import Home from "./pages/page/Home.jsx";
import Login from "./pages/page/Login.jsx";
import Signup from "./pages/page/Signup.jsx";
import Dashboard from "./pages/page/Dashboard.jsx";
import Profile from "./pages/side/Profile.jsx";
import Schedule from "./pages/side/Schedule.jsx";
import City from "./pages/side/City.jsx";
import Board from "./pages/side/Board.jsx";
import Contract from "./pages/side/Contract.jsx";
import NotFound from "./pages/page/404.jsx";

// Trip-Diner 페이지
import TripPlanner from "./pages/trip/TripPlanner.jsx";
import TripResult from "./pages/trip/TripResult.jsx";

export default function App() {
  const [user, setUser] = useState(null);
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
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {/* 메인 홈 */}
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

        {/* Trip-Diner: 여행 생성 */}
        <Route path="/tours" element={<Navigate to="/trip" replace />} />
        <Route
          path="/trip"
          element={
            <TripPlanner
              user={user}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          }
        />

        {/* Trip-Diner: 결과 페이지 */}
        <Route
          path="/trip/result"
          element={
            <TripResult
              user={user}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          }
        />

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
            <Schedule user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
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
            <Contract user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          }
        />

        {/* 로그인 후 대시보드 */}
        <Route
          path="/dashboard"
          element={
            <Dashboard user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
