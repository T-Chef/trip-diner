import React from "react";
import { Link } from "react-router-dom";
import "../../../styles/page/home/Header.css";

export default function AdminHeader({ setMenuOpen }) {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/admin" className="logo">
          Trip - Diner <span style={{ color: "#ff3b3b" }}>관리자</span>
        </Link>

        <button className="ham-btn" onClick={() => setMenuOpen(true)}>
          ☰
        </button>
      </div>
    </header>
  );
}
