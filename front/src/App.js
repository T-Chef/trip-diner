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

// 관리자 페이지
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

import ForgotPassword from "./pages/pw/ForgotPassword";
import ResetPassword from "./pages/pw/ResetPassword";

import NotFound from "./pages/page/404.jsx";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  return (
    <Router>
      <Toaster position="top-center" />

      <Routes>

        {/*
         =============================
         관리자 라우트 (Layout 사용 X)
         =============================
        */}

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/*
         =============================
         일반 유저 라우트 (Layout 사용 O)
         =============================
        */}

        <Route
          path="/*"
          element={
            <Layout user={user} setUser={setUser}>
              <Routes>
                <Route path="/" element={<Home user={user} setUser={setUser} />} />

                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/signup" element={<Signup />} />

                <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
                <Route path="/profile/edit" element={<ProfileEdit user={user} setUser={setUser} />} />

                <Route path="/like/posts" element={<Likeposts userId={user?.user_id} />} />
                <Route path="/like/places" element={<Likeplaces userId={user?.user_id} />} />

                <Route path="/withdraw" element={<Unsubscribe user={user} />} />

                <Route path="/calendar" element={<Calendar user={user} />} />

                <Route path="/trip" element={<AISchedule user={user} />} />
                <Route path="/trip/category" element={<TripCategory />} />
                <Route path="/trip/result" element={<AIScheduleResult user={user} />} />

          {/* 게시판 */}
          <Route path="/board/write" element={<BoardWrite />} />
          <Route path="/board/write/:id" element={<BoardWrite />} />
          <Route path="/board/:id" element={<BoardDetail />} />
          <Route path="/board" element={<Board />} />


          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard user={user} />} />
                <Route path="/city" element={<CityMain user={user} setUser={setUser} />} />


                <Route path="/board" element={<Board user={user} />} />
                <Route path="/contract" element={<Contract user={user} />} />

                <Route path="/dashboard" element={<Dashboard user={user} />} />

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

