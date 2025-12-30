import React, { useEffect, useRef } from "react";
import "../../styles/page/home/HomeLayout.css";
import { Footer, Hero, Section1, Section2, Section3 } from ".";

export default function Home() {
  const sectionsRef = useRef([]);
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle("show", e.isIntersecting);
        });
      },
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );

    sectionsRef.current.forEach((sec) => sec && observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          e.target.classList.toggle("show", e.isIntersecting);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    heroRef.current && heroObserver.observe(heroRef.current);
    return () => heroObserver.disconnect();
  }, []);

  return (
    <div className="home-wrapper">
      <Hero heroRef={heroRef} />

      <main id="home-sections" className="home-sections">
        <Section1 sectionRef={(el) => (sectionsRef.current[0] = el)} />
        <Section2 sectionRef={(el) => (sectionsRef.current[1] = el)} />
        <Section3 sectionRef={(el) => (sectionsRef.current[2] = el)} />
      </main>

      <Footer />
    </div>
  );
}
