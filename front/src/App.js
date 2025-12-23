// src/App.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { me } from "./api/authApi";

import Layout from "./components/layout/Layout.jsx";
import RequireAuth from "./components/auth/RequireAuth";

import { getToken, getUser, clearAuth, setAuth } from "./utils/authStorage";

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

// AI / 여행
import AISchedule from "./pages/side/schedule/AISchedule.jsx";
import AIScheduleResult from "./pages/side/schedule/AIScheduleResult.jsx";
import AIScheduleSummary from "./pages/side/schedule/AIScheduleSummary.jsx";
import TripCategory from "./pages/side/schedule/category/TripCategory.jsx";

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
import AdminInquiries from "./pages/admin/AdminInquiries.jsx";

// 비밀번호 재설정
import ForgotPassword from "./pages/pw/ForgotPassword";
import ResetPassword from "./pages/pw/ResetPassword";

// 404
import NotFound from "./pages/page/404.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const forceLogoutAndGoLogin = useCallback(() => {
    const fullPath =
      window.location.pathname + window.location.search + window.location.hash;

    sessionStorage.setItem("auth:from", fullPath);

    clearAuth();
    setUser(null);
    setAuthLoading(false);

    window.dispatchEvent(new Event("auth:logout"));

    if (!window.location.pathname.startsWith("/login")) {
      window.location.replace(`/login?from=${encodeURIComponent(fullPath)}`);
    }
  }, []);

  const authRequired = (element) => (
    <RequireAuth user={user} authLoading={authLoading}>
      {element}
    </RequireAuth>
  );

   useEffect(() => {
    const token = getToken();
    const savedUser = getUser();

    if (!token) {
      clearAuth();        
      setUser(null);
      setAuthLoading(false);
      return;
    }

    if (savedUser) setUser(savedUser);

    me()
    .then((res) => {
        const u = res.data?.user;
        if (u) {
          setUser(u);
          setAuth({ accessToken: token, user: u });
        } else {
          forceLogoutAndGoLogin();
        }
      })
      .catch(() => {
        forceLogoutAndGoLogin();
      })
      .finally(() => setAuthLoading(false));
  }, [forceLogoutAndGoLogin]);

useEffect(() => {
  const syncAuthNow = () => {
    const token = getToken();
    const storedUser = getUser();

    if (userRef.current && (!token || !storedUser)) {
      forceLogoutAndGoLogin();
    }
  };

  const onStorage = (e) => {
    if (e.key === "accessToken" || e.key === "user") syncAuthNow();
  };

  const onFocus = () => syncAuthNow();

  const onVisibility = () => {
    if (document.visibilityState === "visible") syncAuthNow();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility); 

  const intervalId = setInterval(() => {
    if (document.visibilityState === "visible") syncAuthNow();
  }, 1000);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
    clearInterval(intervalId);
  };
}, [forceLogoutAndGoLogin]);

  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setAuthLoading(false);
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

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
          <Route path="inquiries" element={<AdminInquiries />} />
        </Route>

        {/* 일반 유저 */}
        <Route
          path="/*"
          element={
            <Layout user={user} setUser={setUser}>
              <Routes>
                <Route path="/" element={<Home user={user} setUser={setUser} />} />

                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/signup" element={<Signup />} />

                {/* 로그인 필요 */}
                <Route path="/profile" element={authRequired(<Profile user={user} setUser={setUser} />)} />
                <Route path="/profile/edit" element={authRequired(<ProfileEdit user={user} setUser={setUser} />)} />

                <Route path="/like/posts" element={authRequired(<Likeposts userId={user?.user_id} />)} />
                <Route path="/like/places" element={authRequired(<Likeplaces userId={user?.user_id} />)} />

                <Route path="/withdraw" element={authRequired(<Unsubscribe user={user} />)} />
                <Route path="/calendar" element={authRequired(<Calendar user={user} />)} />

                <Route path="/trip" element={authRequired(<AISchedule user={user} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />)} />
                <Route path="/trip/category" element={authRequired(<TripCategory />)} />
                <Route path="/trip/result" element={authRequired(<AIScheduleResult user={user} />)} />
                <Route path="/trip/summary" element={authRequired(<AIScheduleSummary />)} />

                <Route path="/schedule" element={<Navigate to="/trip" replace />} />
                <Route path="/schedule/result" element={<Navigate to="/trip/result" replace />} />

                {/* City */}
                <Route path="/city" element={<CityMain user={user} setUser={setUser} />} />
                <Route path="/place/:id" element={<PlaceDetail user={user} setUser={setUser} />} />
                <Route path="/event/:id" element={<EventDetail user={user} setUser={setUser} />} />

                {/* 게시판: 글쓰기만 로그인 필요 */}
                <Route path="/board/write" element={authRequired(<BoardWrite />)} />
                <Route path="/board/write/:id" element={authRequired(<BoardWrite />)} />

                <Route path="/board/:id" element={<BoardDetail />} />
                <Route path="/board/list" element={<Board />} />
                <Route path="/board/list/:category" element={<Board />} />
                <Route path="/board" element={<Board />} />

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
