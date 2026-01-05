import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../../styles/page/home/SideMenu.css";

function Icon({ type }) {
  const common = {
    className: "menu-icon",
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
  };

  switch (type) {
    case "profile":
      return (
        <svg {...common}>
          <path
            d="M20 21a8 8 0 0 0-16 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path
            d="M10 7V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 12h10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M7 9l-3 3 3 3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path
            d="M7 3v3M17 3v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M4 8h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 12h4M8 16h8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "map":
      return (
        <svg {...common}>
          <path
            d="M10 21 3 18V6l7 3 7-3 4 2v12l-4-2-7 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 9v12M17 6v12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "board":
      return (
        <svg {...common}>
          <path d="M4 6h16v14H4V6Z" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 10h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 6v14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "contact":
      return (
        <svg {...common}>
          <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 8l8 6 8-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function NavItem({ to, label, icon, active, onClick }) {
  return (
    <li className="menu-item">
      <Link
        to={to}
        className={`menu-link ${active ? "is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={onClick}
      >
        <span className="menu-link__left">
          <Icon type={icon} />
          <span className="menu-text">{label}</span>
        </span>
      </Link>
    </li>
  );
}

export default function SideMenu({ user, setUser, menuOpen, setMenuOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    close();
    navigate("/");
  };

  const isActive = (base) =>
    location.pathname === base || location.pathname.startsWith(base + "/");

  return (
    <div className="layout-wrapper">
      <aside
        className={`side-menu ${menuOpen ? "open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="side-menu__header">
          <div className="side-menu__brand">
            <span className="side-menu__brandTitle">Trip · Diner</span>
            <span className="side-menu__brandSub">Travel Menu</span>
          </div>

          <button className="close-btn" onClick={close} aria-label="Close menu">
            ×
          </button>
        </div>

        <div className="side-menu__paper">
          <ul className="side-menu__list">
            {user ? (
              <>
                <li className="menu-item menu-item--welcome">
                  <Link
                    to="/profile"
                    className={`menu-link ${
                      isActive("/profile") ? "is-active" : ""
                    }`}
                    aria-current={isActive("/profile") ? "page" : undefined}
                    onClick={close}
                  >
                    <span className="menu-link__left">
                      <Icon type="profile" />
                      <span className="menu-text">
                        <b>{user.name || user.username}</b> 님 환영합니다
                      </span>
                    </span>
                  </Link>
                </li>

                <li className="menu-item">
                  <button
                    type="button"
                    className="menu-link logout-btn"
                    onClick={handleLogout}
                  >
                    <span className="menu-link__left">
                      <Icon type="logout" />
                      <span className="menu-text">로그아웃</span>
                    </span>
                  </button>
                </li>

                <li className="side-menu__divider" />
              </>
            ) : (
              <>
                <NavItem
                  to="/login"
                  label="로그인 / 회원가입"
                  icon="profile"
                  active={isActive("/login")}
                  onClick={close}
                />
                <li className="side-menu__divider" />
              </>
            )}

            <NavItem
              to="/schedule"
              label="AI 일정표"
              icon="calendar"
              active={isActive("/schedule")}
              onClick={close}
            />

            <NavItem
              to="/city"
              label="도시별 여행 정보"
              icon="map"
              active={isActive("/city")}
              onClick={close}
            />

            <NavItem
              to="/board"
              label="게시판"
              icon="board"
              active={isActive("/board")}
              onClick={close}
            />

            <NavItem
              to="/qna/write"
              label="문의하기"
              icon="contact"
              active={isActive("/qna/write")}
              onClick={close}
            />
          </ul>
        </div>
      </aside>

      <div className={`overlay ${menuOpen ? "show" : ""}`} onClick={close} />
    </div>
  );
}
