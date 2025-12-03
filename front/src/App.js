import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Navigate } from "react-router-dom";

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
import FavoritesPage from "./pages/side/mypage/FavoritesPage.jsx";
import FavoritesCity from "./pages/side/mypage/FavoritesCity.jsx";
import Unsubscribe from "./pages/side/mypage/Unsubscribe.jsx";
import Calendar from "./pages/side/mypage/Calendar.jsx";

// AI 계획 일정
import AISchedule from "./pages/side/schedule/AISchedule.jsx";
import AIScheduleResult from "./pages/side/schedule/AIScheduleResult.jsx";
import TripCategory from "./pages/side/schedule/category/TripCategory.jsx";

// 사이드 메뉴
import City from "./pages/side/City.jsx";
import Board from "./pages/side/Board.jsx";
import Contract from "./pages/side/Contract.jsx";

// 비밀번호 재설정 페이지
import ForgotPassword from "./pages/pw/ForgotPassword";
import ResetPassword from "./pages/pw/ResetPassword";

// 기타
import NotFound from "./pages/page/404.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // -------------------------------
  // 로그인 유지 (최초 1회)
  // -------------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // -------------------------------
  // user 값 변경될 때마다 localStorage 에 자동 저장
  // 프로필 이미지 업데이트 후 값이 유지되도록 함
  // -------------------------------
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
  }, [user]);

  return (
    <Router>
      <Toaster position="top-center" reverseOrder={false} />

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
          <Route path="/favorites/page" element={<FavoritesPage user={user} />} />
          <Route path="/favorites/city" element={<FavoritesCity user={user} />} />
          <Route path="/withdraw" element={<Unsubscribe user={user} />} />

         {/* 캘린더 */}
        <Route path="/calendar" element={<Calendar user={user} />} />

        {/* Trip-Diner (AI 여행 계획) */}
          <Route path="/trip" element={<AISchedule user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />} />
          <Route path="/trip/category" element={<TripCategory />} />
          <Route path="/trip/result" element={<AIScheduleResult user={user} />} />

        {/* 기존 schedule url → trip으로 매핑 */}
          <Route path="/schedule" element={<Navigate to="/trip" replace />} />
          <Route path="/schedule/result" element={<Navigate to="/trip/result" replace />} />
       

        {/* 나머지 메뉴 */}
          <Route path="/city" element={<City user={user} setUser={setUser} />} />
          <Route path="/board" element={<Board user={user} />} />
          <Route path="/contract" element={<Contract user={user} />} />

          {/* 대시보드 */}
          <Route path="/dashboard" element={<Dashboard user={user} />} />

          {/*비밀번호 재설정 페이지*/}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
{/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}