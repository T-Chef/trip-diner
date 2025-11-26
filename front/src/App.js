import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
<<<<<<< HEAD
import { Toaster } from "react-hot-toast";
import { Navigate } from "react-router-dom";


// 기존 페이지
import Home from "./pages/page/Home.jsx";
import Login from "./pages/page/Login.jsx";
import Signup from "./pages/page/Signup.jsx";
import Dashboard from "./pages/page/Dashboard.jsx";
import RecommendPage from "./pages/page/RecommendPage.jsx";
import StyleSelect from "./pages/page/StyleSelect.jsx";
=======

// Pages
import Home from "./pages/page/Home.jsx";
import Login from "./pages/page/Login.jsx";
import Signup from "./pages/page/Signup.jsx";
>>>>>>> b193842a26fb596cf296e6edd1209ec9e687227d
import Profile from "./pages/side/Profile.jsx";
import Schedule from "./pages/side/Schedule.jsx";
import City from "./pages/side/City.jsx";
import Board from "./pages/side/Board.jsx";
import Contract from "./pages/side/Contract.jsx";
import NotFound from "./pages/page/404.jsx";

<<<<<<< HEAD
// Trip-Diner 페이지
import TripPlanner from "./pages/trip/TripPlanner.jsx";
import TripResult from "./pages/trip/TripResult.jsx";

export default function App() {
  const [user, setUser] = useState(null);
=======
export default function App() {
  // 로그인 사용자 상태
  const [user, setUser] = useState(null);

  // 사이드메뉴 상태
>>>>>>> b193842a26fb596cf296e6edd1209ec9e687227d
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
<<<<<<< HEAD
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {/* 메인 홈 */}
=======
      <Routes>
        {/* 메인 */}
>>>>>>> b193842a26fb596cf296e6edd1209ec9e687227d
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

<<<<<<< HEAD
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

=======
>>>>>>> b193842a26fb596cf296e6edd1209ec9e687227d
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
<<<<<<< HEAD
            <Schedule user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
=======
            <Schedule
              user={user}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
>>>>>>> b193842a26fb596cf296e6edd1209ec9e687227d
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
<<<<<<< HEAD
            <Contract user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          }
        />

        {/* 추천 페이지 */}
        <Route
          path="/recommend"
          element={
            <RecommendPage
=======
            <Contract
>>>>>>> b193842a26fb596cf296e6edd1209ec9e687227d
              user={user}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
          }
        />

<<<<<<< HEAD
        {/* 스타일 선택 */}
        <Route
          path="/style"
          element={
            <StyleSelect
              user={user}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
            />
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
=======
        {/* 404 페이지 */}
>>>>>>> b193842a26fb596cf296e6edd1209ec9e687227d
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> b193842a26fb596cf296e6edd1209ec9e687227d
