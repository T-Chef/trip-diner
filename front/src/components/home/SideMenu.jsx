import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/page/home/SideMenu.css";
import api from "../../pages/page/login/api";

export default function SideMenu({ user, setUser, menuOpen, setMenuOpen }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      setMenuOpen(false);
      navigate("/");
    }
  };

  return (
    <div className="layout-wrapper">
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>
          X
        </button>

        <ul>
          {user ? (
            <>
              <li className="menu-item">
                <Link
                  to="/profile"
                  className="menu-link full-click"
                  onClick={() => setMenuOpen(false)}
                >
                  {user.name || user.username} 님 환영합니다!
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
            </>
          ) : (
            <li className="menu-item">
              <Link
                to="/login"
                className="menu-link"
                onClick={() => setMenuOpen(false)}
              >
                로그인 / 회원가입
              </Link>
            </li>
          )}

          <li className="menu-item">
            <Link to="/schedule" className="menu-link" onClick={() => setMenuOpen(false)}>
              AI 일정표
            </Link>
          </li>

          <li className="menu-item">
            <Link to="/city" className="menu-link" onClick={() => setMenuOpen(false)}>
              도시별 여행 정보
            </Link>
          </li>

          <li className="menu-item">
            <Link to="/board" className="menu-link" onClick={() => setMenuOpen(false)}>
              게시판
            </Link>
          </li>

          <li className="menu-item">
            <Link to="/contract" className="menu-link" onClick={() => setMenuOpen(false)}>
              문의하기
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
