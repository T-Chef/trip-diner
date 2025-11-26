import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/side/SideMenu.css";

export default function SideMenu({ user, setUser, menuOpen, setMenuOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="layout-wrapper">
      {/* SIDEMENU */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>
          x
        </button>

        <ul>
          {user ? (
            <>
              <li>
                <Link to="/profile">{user.name || user.username}</Link> 님
                환영합니다!
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
            </>
          ) : (
            <li>
              <Link to="/login">로그인 / 회원가입</Link>
            </li>
          )}

          <li>
            <Link to="/schedule">AI 일정표</Link>
          </li>
          <li>
            <Link to="/city">도시별 여행 정보</Link>
          </li>
          <li>
            <Link to="/board">게시판</Link>
          </li>
          <li>
            <Link to="/contact">문의하기</Link>
          </li>
        </ul>
      </div>

      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
