import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layout
import Layout from "./components/layout/Layout.jsx";

// 기본 페이지
import Home from "./components/home/Home.jsx";
import Login from "./pages/page/login/Login.jsx";
import Signup from "./pages/page/login/Signup.jsx";
import Dashboard from "./pages/page/login/Dashboard.jsx";

// 마이페이지
import Profile from "./pages/side/mypage/Profile.jsx";
import ProfileEdit from "./pages/side/mypage/ProfileEdit.jsx";
import Likeposts from "./pages/side/mypage/Likeposts.jsx";
import Likeplaces from "./pages/side/mypage/Likeplaces.jsx";
import Unsubscribe from "./pages/side/mypage/Unsubscribe.jsx";
import Calendar from "./pages/side/mypage/Calendar.jsx";

// AI (주한이형)
import AISchedule from "./pages/side/schedule/AISchedule.jsx";
import AIScheduleResult from "./pages/side/schedule/AIScheduleResult.jsx";
import TripCategory from "./pages/side/schedule/category/TripCategory.jsx";

// City (진호)
import CityMain from "./components/city/CityMain.jsx";

// 게시판 (서희)
import Board from "./pages/side/board/Board.jsx";
import BoardWrite from "./pages/side/board/BoardWrite.jsx";
import BoardDetail from "./pages/side/board/BoardDetail.jsx";

// 사이드
import Contract from "./pages/side/Contract.jsx";

// 비밀번호 재설정
import ForgotPassword from "./pages/pw/ForgotPassword";
import ResetPassword from "./pages/pw/ResetPassword";

// 404
import NotFound from "./pages/page/404.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // 로그인 유지
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // user 변경 시 저장하기
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  return (
    <Router>
      <Toaster position="top-center" />

      <Layout user={user} setUser={setUser}>
        <Routes>

          {/* 홈 */}
          <Route path="/" element={<Home user={user} setUser={setUser} />} />

          {/* 로그인/회원가입 */}
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup />} />

          {/* 마이페이지 */}
          <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
          <Route path="/profile/edit" element={<ProfileEdit user={user} setUser={setUser} />} />
          <Route path="/like/posts" element={<Likeposts user={user} />} />
          <Route path="/like/places" element={<Likeplaces user={user} />} />
          <Route path="/withdraw" element={<Unsubscribe user={user} />} />

          {/* 캘린더 */}
          <Route path="/calendar" element={<Calendar user={user} />} />

          {/* Trip-Diner */}
          <Route
            path="/trip"
            element={<AISchedule user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />}
          />
          <Route path="/trip/category" element={<TripCategory />} />
          <Route path="/trip/result" element={<AIScheduleResult user={user} />} />

          {/* 스케쥴*/}
          <Route path="/schedule" element={<Navigate to="/trip" replace />} />
          <Route path="/schedule/result" element={<Navigate to="/trip/result" replace />} />

          {/* City 페이지 */}
          <Route path="/city" element={<CityMain user={user} setUser={setUser} />} />

          {/* 나머지 메뉴 */}
          <Route path="/board" element={<Board user={user} />} />
          <Route path="/contract" element={<Contract user={user} />} />

          {/* 게시판 */}
          <Route path="/board" element={<Board user={user} />} />
          <Route path="/board/write" element={<BoardWrite user={user} />} />
          <Route path="/board/detail" element={<BoardDetail user={user} />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard user={user} />} />

          {/* 비밀번호 재설정 */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Layout>
    </Router>
  );
}