import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// CSS — styles 폴더
import "./styles/App.css";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Tours from "./pages/Tours";
import Contract from "./pages/Contract";
import NotFound from "./pages/NotFound";

export default function App() {
  // 로그인 사용자 상태
  const [user, setUser] = useState(null);

  // 새로고침해도 로그인 유지
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
        <Route path="/" element={<Home user={user} setUser={setUser} />} />

        {/* 로그인 */}
        <Route path="/login" element={<Login setUser={setUser} />} />

        {/* 회원가입 */}
        <Route path="/signup" element={<Signup />} />

        {/* AI 일정표 */}
        <Route path="/tours" element={<Tours />} />

        {/* 계약 / 본인 인증 등 페이지 */}
        <Route path="/contract" element={<Contract />} />
        
        {/* ⭐ 404 페이지 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
