import { Link } from "react-router-dom";
import "../../styles/page/home/Header.css";

export default function Header({ menuOpen, setMenuOpen, user, handleLogout }) {
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="logo">Trip - Diner</div>
          <button className="ham-btn" onClick={() => setMenuOpen(true)}>☰</button>
        </div>
      </header>

      <div className={`side-menu ${menuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>

        <ul>
          {user ? (
            <>
              <li className="welcome">{user.name}님 환영합니다!</li>
              <li className="logout-btn" onClick={handleLogout}>로그아웃</li>
            </>
          ) : (
            <li><Link to="/login">로그인 / 회원가입</Link></li>
          )}

          <li><Link to="/tours">여행상품</Link></li>
          <li><Link to="/contact">문의하기</Link></li>
        </ul>
      </div>
    </>
  );
}
