
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
import MyTrips from "./pages/side/mypage/MyTrips.jsx";
import QnAWrite from "./pages/side/mypage/UserQnA";
import UserQnADetail from "./pages/side/mypage/UserQnADetail.jsx"

// AI / 여행
import AISchedule from "./pages/side/schedule/AISchedule.jsx";
import AIScheduleResult from "./pages/side/schedule/AIScheduleResult.jsx";
import AIScheduleSummary from "./pages/side/schedule/AIScheduleSummary.jsx";
import TripCategory from "./pages/side/schedule/category/TripCategory.jsx";
import PickStartDatePage from "./pages/side/schedule/PickStartDatePage.jsx";

// City 
import CityMain from "./pages/side/city/CityMain.jsx";
import PlaceDetail from "./pages/side/city/place/PlaceDetail.jsx";
import EventDetail from "./pages/side/city/event/EventDetail.jsx";

// 게시판 
import Board from "./pages/side/board/Board.jsx";
import BoardWrite from "./pages/side/board/BoardWrite.jsx";
import BoardDetail from "./pages/side/board/BoardDetail.jsx";

// 관리자
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/layout/AdminLayout.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminPosts from "./pages/admin/AdminPosts.jsx";
import AdminQnA from "./pages/admin/AdminQnA.jsx";
import AdminQnADetail from "./pages/admin/AdminQnADetail.jsx";

// 비밀번호 재설정
import ForgotPassword from "./pages/pw/ForgotPassword";
import ResetPassword from "./pages/pw/ResetPassword";

// 404
import NotFound from "./pages/page/404.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
        {/* 관리자 */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/*" element={<AdminLayout />}>
        <Route path="users" element={<AdminUsers />} />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="qna" element={<AdminQnA />} />
        <Route path="qna/:id" element={<AdminQnADetail />} />
        </Route>

        {/* 일반 유저 */}
        <Route
          path="/*"
          element={
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
                <Route path="/my-trips" element={<MyTrips user={user} />} />
                <Route path="/qna/write" element={<QnAWrite user={user} />} />
                <Route path="/mypage/qna/:id" element={<UserQnADetail />} />

                {/* 좋아요 */}
                <Route path="/like/posts" element={<Likeposts userId={user?.user_id} />} />
                <Route path="/like/places" element={<Likeplaces userId={user?.user_id} />} />

                <Route path="/withdraw" element={<Unsubscribe user={user} />} />
                <Route path="/calendar" element={<Calendar user={user} />} />

                {/* Trip-Diner */}
                <Route
                  path="/trip"
                  element={<AISchedule user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />}
                />
                <Route path="/trip/category" element={<TripCategory />} />
                <Route path="/trip/result" element={<AIScheduleResult user={user} />} />
                <Route path="/trip/summary" element={<AIScheduleSummary />} />

                {/* 구 경로 리다이렉트 */}
                <Route path="/schedule" element={<Navigate to="/trip" replace />} />
                <Route path="/schedule/result" element={<Navigate to="/trip/result" replace />} />

                <Route path="/schedule/pick-start-date" element={<PickStartDatePage />} />

                {/* City */}
                <Route path="/city" element={<CityMain user={user} setUser={setUser} />} />
                <Route path="/place/:id" element={<PlaceDetail user={user} setUser={setUser} />} />
                <Route path="/event/:id" element={<EventDetail user={user} setUser={setUser} />} />

                {/* 게시판 */}
                <Route path="/board/write" element={<BoardWrite />} />
                <Route path="/board/write/:id" element={<BoardWrite />} />
                <Route path="/board/:id" element={<BoardDetail />} />
                <Route path="/board/list" element={<Board />} />
                <Route path="/board/list/:category" element={<Board />} />
                <Route path="/board" element={<Board />} />

                {/* 기타 */}
                <Route path="/dashboard" element={<Dashboard user={user} />} />

                {/* 비밀번호 */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

