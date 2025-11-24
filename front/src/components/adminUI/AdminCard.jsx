// src/components/adminUI/AdminCard.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Admin({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate("/"); // 로그아웃하면 일반 홈으로 이동
  };

  return (
    <header className="admin-header">
      <div className="logo">Travel - Chef (Admin)</div>

      <nav>
        <ul>
          <li>
            <Link to="/admin">홈</Link>
          </li>

          <li>
            <span>{user?.name || "관리자"}님 (관리자)</span>
          </li>

          <li>
            <button className="admin-logout-btn" onClick={handleLogout}>
              로그아웃
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
