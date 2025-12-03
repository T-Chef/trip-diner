import { useEffect, useRef } from "react";
import "../../styles/page/home/Section2.css";

export default function Section2({ sectionRef }) {
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
      className="openbook-section section2"
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
        <span className="sec-badge">추천 정보</span>
        <h2 className="section-title">여행 계획은 간단하게</h2>
        <p className="section-desc">
          당신의 일정 취향에 맞춘 여행 추천과 실제 여행자들의 데이터를 기반으로
          가장 많이 방문한 인기 명소를 알려드려요.
        </p>
      </div>

      {/* RIGHT */}
      <div className="open-right">
        <div
          className="recommend-card fade-item"
          ref={(el) => (fadeRefs.current[1] = el)}
        >
          <h4>📌 인기 명소 TOP 10</h4>
          <p>데이터 기반 여행 트렌드</p>
        </div>

        <div
          className="recommend-card fade-item"
          ref={(el) => (fadeRefs.current[2] = el)}
        >
          <h4>📌 여행 일정 자동 생성</h4>
          <p>성향 맞춤형 일정 구성</p>
        </div>

        <div
          className="recommend-card fade-item"
          ref={(el) => (fadeRefs.current[3] = el)}
        >
          <h4>📌 지역별 맛집 추천</h4>
          <p>실제 여행자 리뷰 기반</p>
        </div>
      </div>
    </section>
  );
}
