import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// CSS 공통
import "../../styles/page/home/HomeLayout.css";

// 섹션별 컴포넌트 import
import { Header, SideMenu, Footer, Hero, Section1, Section2, Section3 } from "../../components/home";

export default function Home({ user, setUser }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const sectionsRef = useRef([]);
  const heroRef = useRef(null);

  /* === 로그아웃 === */

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setMenuOpen(false);
    navigate("/");
  };

  /* === Section 페이드업 Observer === */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("show");
          } else {
            e.target.classList.remove("show");
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    sectionsRef.current.forEach((sec) => sec && observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  /* === Hero 페이드업 Observer === */
  useEffect(() => {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("show");
          } else {
            e.target.classList.remove("show");
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    heroRef.current && heroObserver.observe(heroRef.current);
    return () => heroObserver.disconnect();
  }, []);

  

  return (
    <div className="home-wrapper">
      <Header 
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        handleLogout={handleLogout}
      />

      <SideMenu 
      user={user}
      setUser={setUser}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
    />

      {/* HERO */}
      <Hero heroRef={heroRef} />

      {/* SECTION 1 */}
      <Section1 sectionRef={el => (sectionsRef.current[0] = el)} />

      {/* SECTION 2 */}
      <Section2 sectionRef={el => (sectionsRef.current[1] = el)} />

      {/* SECTION 3 */}
      <Section3 sectionRef={el => (sectionsRef.current[2] = el)} />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
