// src/AdminApp.js (관리자용)
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import Admin from "./pages/Admin.jsx";

function AdminHeader({ user, setUser }) {
    const navigate = useNavigate();
    const handleLogout = () => {
        setUser(null);
        navigate("/");
    }

    return (
        <header>
            <div className="logo">Travel -chef (Admin)</div>
            <nav>
                <ul>
                    <li><Link to="/">홈</Link></li>
                    <li><span>{user.name}님 (관리자)</span></li>
                    <li>
                        <button onClick={handleLogout} style={{ border: "none", background: "none", cursor: "pointer"}}>로그아웃</button>
                    </li>
                </ul>
            </nav>
        </header>
    );
 }
   
 function AdminApp() {
  const [user, setUser] = useState({
    email: "admin@gmail.com",
    name: "관리자",
  });

  const [dummyUsers, setDummyUsers] = useState([
    { email: "whtjgml2002@naver.com", password: "1234", name: "조서희" },
    { email: "dooly@gmail.com", password: "1111", name: "둘리" },
    { email: "admin@gmail.com", password: "0000", name: "관리자" },
  ]);

  return (
    <BrowserRouter>
      <AdminHeader user={user} setUser={setUser} />
      <Routes>
        <Route
          path="/admin"
          element={<Admin user={user} dummyUsers={dummyUsers} setDummyUsers={setDummyUsers} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AdminApp;