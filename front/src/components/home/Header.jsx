import { Link } from "react-router-dom";
import "../../styles/page/home/Header.css";

export default function Header({ setMenuOpen, user }) {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">Trip - Diner</Link>

        <button className="ham-btn" onClick={() => setMenuOpen(true)}>☰</button>
      </div>
    </header>
  );
}
