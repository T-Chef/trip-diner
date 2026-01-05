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
    <>
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <div className="side-menu__header">
          <div>
            <span className="side-menu__brandTitle">Trip • Diner</span>
            <span className="side-menu__brandSub">Admin Panel</span>
          </div>

          <button className="close-btn" onClick={() => setMenuOpen(false)}>
            ✕
          </button>
        </div>

        <div className="side-menu__paper">
          <ul className="side-menu__list">
            <li className="menu-item menu-item--welcome">
              <span className="menu-link">
                <span className="menu-text">관리자님 반갑습니다. </span>
              </span>
            </li>

            <div className="side-menu__divider" />

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
                to="/admin/qna"
                className="menu-link"
                onClick={() => setMenuOpen(false)}
              >
                1:1 문의 답변
              </Link>
            </li>

            <div className="side-menu__divider" />

            <li className="menu-item">
              <button
                type="button"
                className="menu-link logout-btn"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div
        className={`overlay ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
    </>
  );
}
