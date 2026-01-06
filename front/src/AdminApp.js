import React, { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";

import Admin from "./pages/Admin.jsx";
import AdminPosts from "./pages/admin/AdminPosts.jsx";
import AdminQnA from "./pages/admin/AdminQnA.jsx";
import AdminQnADetail from "./pages/admin/AdminQnADetail.jsx";

function AdminHeader({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <header>
      <div className="logo">Travel - chef (Admin)</div>

      <nav>
        <ul>
          <li>
            <Link to="/admin">홈</Link>
          </li>
          <li>
            <Link to="/admin/posts">게시글 관리</Link>
          </li>
          <li>
            <Link to="/admin/qna">1:1 문의 관리</Link>
          </li>

          <li>
            <span>{user.name}님 (관리자)</span>
          </li>

          <li>
            <button
              onClick={handleLogout}
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              로그아웃
            </button>
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
    <>
      <AdminHeader user={user} setUser={setUser} />

      <Routes>
        <Route
          index
          element={
            <Admin
              user={user}
              dummyUsers={dummyUsers}
              setDummyUsers={setDummyUsers}
            />
          }
        />
        <Route path="posts" element={<AdminPosts />} />
        <Route path="qna" element={<AdminQnA />} />
        <Route path="qna/:id" element={<AdminQnADetail />} />
      </Routes>
    </>
  );
}

export default AdminApp;
