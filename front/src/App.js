// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// =======================
// 일반 유저 Layout
// =======================
import Layout from "./components/layout/Layout.jsx";

// 기본 페이지
import Home from "./components/home/Home.jsx";
import Login from "./pages/page/login/Login.jsx";
import Signup from "./pages/page/login/Signup.jsx";

// 마이페이지
import Profile from "./pages/side/mypage/Profile.jsx";
import ProfileEdit from "./pages/side/mypage/ProfileEdit.jsx";
import Likeposts from "./pages/side/mypage/Likeposts.jsx";
import Likeplaces from "./pages/side/mypage/Likeplaces.jsx";
import Unsubscribe from "./pages/side/mypage/Unsubscribe.jsx";
import Calendar from "./pages/side/mypage/Calendar.jsx";

// AI / 여행
import AISchedule from "./pages/side/schedule/AISchedule.jsx";
import AIScheduleResult from "./pages/side/schedule/AIScheduleResult.jsx";
import TripCategory from "./pages/side/schedule/category/TripCategory.jsx";

// City
import CityMain from "./components/city/CityMain.jsx";

// 게시판
import Board from "./pages/side/board/Board.jsx";
import BoardWrite from "./pages/side/board/BoardWrite.jsx";
import BoardDetail from "./pages/side/board/BoardDetail.jsx";

// 기타
import Contract from "./pages/side/Contract.jsx";

// =======================
// 관리자
// =======================
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/layout/AdminLayout.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPosts from "./pages/admin/AdminPosts.jsx";
import AdminInquiries from "./pages/admin/AdminInquiries.jsx";

// 비밀번호
import ForgotPassword from "./pages/pw/ForgotPassword";
import ResetPassword from "./pages/pw/ResetPassword";

// 404
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
        {/* =========================
            관리자
        ========================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* 관리자 메인 (메인 페이지 스타일 그대로 쓸 예정) */}
        <Route path="/admin" element={<AdminHome />} />

        {/* 관리자 관리 영역 */}
        <Route path="/admin/*" element={<AdminLayout />}>
          <Route path="users" element={<AdminUsers />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="inquiries" element={<AdminInquiries />} />
        </Route>

        {/* =========================
            일반 유저
        ========================= */}
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

                <Route path="/board/write" element={<BoardWrite />} />
                <Route path="/board/write/:id" element={<BoardWrite />} />
                <Route path="/board/:id" element={<BoardDetail />} />
                <Route path="/board" element={<Board />} />

                <Route path="/city" element={<CityMain user={user} setUser={setUser} />} />
                <Route path="/contract" element={<Contract user={user} />} />

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
