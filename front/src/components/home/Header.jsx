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
        <Link to="/" className="logo">
          Trip - Diner
        </Link>

        <button
          className="menu-btn"
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <svg className="menu-icon" viewBox="0 0 24 24" role="img" aria-hidden="true">
            {/* Chef hat */}
            <path d="M6 10c-1.66 0-3-1.34-3-3s1.34-3 3-3c.35 0 .69.06 1.01.17C7.54 2.52 8.68 2 10 2c1.38 0 2.58.56 3.29 1.46C13.63 3.16 14.05 3 14.5 3c1.38 0 2.5 1.12 2.5 2.5 0 .19-.02.37-.06.55.33-.03.69-.05 1.06-.05 1.66 0 3 1.34 3 3s-1.34 3-3 3" />
            <path d="M6 10h12" />
            <path d="M7 10v8c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-8" />
            <path d="M9 14h6" />
            <path d="M9 16h6" />
          </svg>
        </button>
      </div>
    </header>
  );
}
