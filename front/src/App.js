import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

// 실제 페이지 import
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Tours from "./Pages/Tours";
import Contract from "./Pages/Contract";

export default function App() {

  // 로그인 사용자 상태
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home user={user} />} />

        {/* 반드시 setUser 전달! */}
        <Route path="/login" element={<Login setUser={setUser} />} />

        <Route path="/signup" element={<Signup />} />
        <Route path="/tours" element={<Tours />} />
        <Route path="/contract" element={<Contract />} />
      </Routes>
    </Router>
  );
}
