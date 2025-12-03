import { useEffect, useRef } from "react";
import "../../styles/page/home/Section2.css";

export default function Section2({ sectionRef }) {
  const paperBg = process.env.PUBLIC_URL + "/assets/images/cream-paper.jpg";

  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("show");
        });
      },
      { threshold: 0.3 }
    );

    cardRefs.current.forEach((card) => card && observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="section-box menu-layout"
      ref={sectionRef}
      style={{
        backgroundImage: `
          linear-gradient(to bottom, rgba(255,255,255,0.96), rgba(250,250,250,0.96)),
          url(${paperBg})
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* LEFT PAGE */}
      <div className="menu-left">
        <p className="intro-badge">여행 정보 · 분석</p>

        <h2 className="intro-title">
          나의 여행 취향,
          <br />
          얼마나 알고 있을까요?
        </h2>

        <p className="intro-subtitle">데이터 기반 취향 분석</p>

        <p className="intro-desc">
          여행 기록을 기반으로 취향을 분석하고 <br />
          나에게 맞는 여행 스타일을 알려줍니다.
        </p>

        <ul className="intro-list">
          <li>✔ 여행 스타일 분석</li>
          <li>✔ 여행 성향 카테고리 분류</li>
          <li>✔ 선호 지역 자동 추천</li>
          <li>✔ 여행 계획 최적화 가이드</li>
        </ul>

        <button className="intro-cta-btn">내 취향 확인하기</button>
      </div>

      {/* RIGHT PAGE */}
      <div className="menu-right">
        <div className="intro-card" ref={(el) => (cardRefs.current[0] = el)}>
          <span className="card-num">1</span>
          <div className="card-info">
            <h4>힐링 여행</h4>
            <p>편안하고 여유로운 여행 스타일</p>
          </div>
          <img
            src="/assets/images/product1.jpg"
            className="card-img"
            alt="힐링 여행"
          />
        </div>

        <div className="intro-card" ref={(el) => (cardRefs.current[1] = el)}>
          <span className="card-num">2</span>
          <div className="card-info">
            <h4>미식 여행</h4>
            <p>맛집 중심 여행자 타입</p>
          </div>
          <img
            src="/assets/images/product2.jpg"
            className="card-img"
            alt="미식 여행"
          />
        </div>

        <div className="intro-card" ref={(el) => (cardRefs.current[2] = el)}>
          <span className="card-num">3</span>
          <div className="card-info">
            <h4>도시 여행</h4>
            <p>활기 있는 도시 탐방 선호</p>
          </div>
          <img
            src="/assets/images/product3.jpg"
            className="card-img"
            alt="도시 여행"
          />
        </div>
      </div>
    </section>
  );
}
