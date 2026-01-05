import React from "react";
import { Link } from "react-router-dom";
import "../../../styles/page/home/Header.css";

export default function AdminHeader({ setMenuOpen }) {
  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/admin" className="logo">
          <img
            src="/assets/textures/logo.jpg"
            alt="Trip Diner"
            className="logo-img"
          />
        </Link>

        <button className="menu-btn" onClick={() => setMenuOpen(true)}>
          <img
            src="/assets/textures/sidemenu.jpg"
            alt="menu"
            className="menu-icon-img"
          />
        </button>
      </div>
    </header>
  );
}
