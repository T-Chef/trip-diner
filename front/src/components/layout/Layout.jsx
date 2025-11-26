import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Layout({
  children,
  user,
  setUser,
  menuOpen,
  setMenuOpen,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="layout-wrapper">
      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="header-left">
            <div className="logo">Trip - Diner</div>
          </div>

          <div className="header-right">
            <button className="ham-btn" onClick={() => setMenuOpen(true)}>
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* SIDEMENU */}
      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>
          ✕
        </button>

        <ul>
          {user ? (
            <>
              <li
                style={{
                  fontWeight: "bold",
                  marginBottom: "10px",
                  fontSize: "18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Link to="/profile">{user.name || user.username}</Link>
                <span>님 환영합니다!</span>
              </li>

              <li>
                <button onClick={handleLogout} className="logout-link">
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
        <div className="overlay" onClick={() => setMenuOpen(false)}></div>
      )}

      {/* MAIN CONTENT */}
      <main className="main-content">{children}</main>

      {/* FOOTER */}
      <footer className="footer">© 2025 Trip - Diner</footer>
    </div>
  );
}
