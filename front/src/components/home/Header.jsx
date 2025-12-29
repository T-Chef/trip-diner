import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/page/home/Header.css";

export default function Header({ setMenuOpen, user }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`header ${scrolled ? "header--scrolled" : ""}`}
      aria-label="Site header"
    >
      <div className="header-inner">
        <Link to="/" className="logo" aria-label="Trip Diner 홈">
          <img
            className="logo-img"
            src="/assets/textures/logo.jpg"
            alt="Trip Diner"
          />
        </Link>

        <button
          className="menu-btn"
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
        <img
          className="menu-icon-img"
          src="/assets/textures/sidemenu.jpg"
          alt=""
          aria-hidden="true"
        />
        </button>
      </div>
    </header>
  );
}
