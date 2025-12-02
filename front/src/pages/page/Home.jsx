import React, { useEffect, useRef } from "react";
import "../../styles/page/home/HomeLayout.css";
import { Footer, Hero, Section1, Section2, Section3 } from "../../components/home";

export default function Home() {

  const sectionsRef = useRef([]);
  const heroRef = useRef(null);


  /* === Section Observer === */
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

  /* === Hero Observer === */
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
