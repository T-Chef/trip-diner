import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../../styles/page/home/SideMenu.css";

export default function AdminSideMenu({ menuOpen, setMenuOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setMenuOpen(false);
    navigate("/admin/login");
  };

  return (
    <div className="layout-wrapper">
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>
          X
        </button>

        <ul>
          <li className="menu-item">
            <Link
              to="/admin"
              className="menu-link full-click"
              onClick={() => setMenuOpen(false)}
            >
              관리자님 반갑습니다
            </Link>
          </li>

          <li className="menu-item">
            <button
              type="button"
              className="menu-link logout-btn"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </li>

          <li className="menu-item">
            <Link
              to="/admin/users"
              className="menu-link"
              onClick={() => setMenuOpen(false)}
            >
              회원 관리
            </Link>
          </li>

          <li className="menu-item">
            <Link
              to="/admin/posts"
              className="menu-link"
              onClick={() => setMenuOpen(false)}
            >
              게시글 관리
            </Link>
          </li>

          <li className="menu-item">
            <Link
              to="/admin/inquiries"
              className="menu-link"
              onClick={() => setMenuOpen(false)}
            >
              1:1 문의 답변
            </Link>
          </li>
        </ul>
      </div>

      <div
        className={`overlay ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
    </div>
  );
}
