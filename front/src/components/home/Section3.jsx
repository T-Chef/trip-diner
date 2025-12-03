import { useEffect, useRef } from "react";
import "../../styles/page/home/Section3.css";

export default function Section3({ sectionRef }) {
  const paperBg = process.env.PUBLIC_URL + "/assets/images/cream-paper.jpg";
  const fadeRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("show");
        });
      },
      { threshold: 0.25 }
    );

    fadeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="openbook-section section3"
      ref={sectionRef}
      style={{
        backgroundImage: `
          linear-gradient(to bottom, rgba(255,255,255,0.96), rgba(250,250,250,0.96)),
          url(${paperBg})
        `,
      }}
    >
      {/* LEFT */}
      <div
        className="open-left fade-item"
        ref={(el) => (fadeRefs.current[0] = el)}
      >
        <span className="sec-badge">여행 취향 분석</span>
        <h2 className="section-title">당신의 여행 성향을 분석해드려요</h2>
        <p className="section-desc">
          여행지, 이동 동선, 음식 취향까지 당신이 좋아할 만한 여행을 똑똑하게
          추천해드립니다.
        </p>
      </div>

      {/* RIGHT */}
      <div className="open-right">
        <div
          className="recommend-card fade-item"
          ref={(el) => (fadeRefs.current[1] = el)}
        >
          <h4>🌿 힐링형 여행자</h4>
          <p>편안함과 여유를 선호</p>
        </div>

        <div
          className="recommend-card fade-item"
          ref={(el) => (fadeRefs.current[2] = el)}
        >
          <h4>📸 감성형 여행자</h4>
          <p>풍경·사진·카페 중심</p>
        </div>

        <div
          className="recommend-card fade-item"
          ref={(el) => (fadeRefs.current[3] = el)}
        >
          <h4>🎢 액티비티형 여행자</h4>
          <p>체험·놀이 중심 여행 선호</p>
        </div>
      </div>
    </section>
  );
}
