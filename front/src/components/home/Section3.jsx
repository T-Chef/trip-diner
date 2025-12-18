import { useEffect, useRef } from "react";
import "../../styles/page/home/Section3.css";

export default function Section3({ sectionRef }) {
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
        <p className="intro-badge">여행 상품 · 추천</p>

        <h2 className="intro-title">
          당신에게 맞는 여행 상품,
          <br />한 번에 추천해드릴게요
        </h2>

        <p className="intro-subtitle">취향 기반 추천 알고리즘</p>

        <p className="intro-desc">
          여행 스타일 분석을 바탕으로 <br />
          당신만을 위한 상품을 큐레이션합니다.
        </p>

        <ul className="intro-list">
          <li>✔ 인기 여행지 추천</li>
          <li>✔ 테마별 맞춤 여행</li>
          <li>✔ 후기 기반 신뢰도 높은 상품</li>
          <li>✔ 가족 / 커플 / 혼자 모두 만족</li>
        </ul>

        <button className="intro-cta-btn">추천 상품 보기</button>
      </div>

      {/* RIGHT PAGE */}
      <div className="menu-right">
        <div className="intro-card" ref={(el) => (cardRefs.current[0] = el)}>
          <span className="card-num">1</span>
          <div className="card-info">
            <h4>제주 힐링 코스</h4>
            <p>자연과 함께하는 휴식 여행</p>
          </div>
          <img
            src="/assets/images/plan1.jpg"
            className="card-img"
            alt="제주 힐링 코스"
          />
        </div>

        <div className="intro-card" ref={(el) => (cardRefs.current[1] = el)}>
          <span className="card-num">2</span>
          <div className="card-info">
            <h4>강릉 감성 여행</h4>
            <p>카페 · 바다 · 감성 충전</p>
          </div>
          <img
            src="/assets/images/plan2.jpg"
            className="card-img"
            alt="강릉 여행"
          />
        </div>

        <div className="intro-card" ref={(el) => (cardRefs.current[2] = el)}>
          <span className="card-num">3</span>
          <div className="card-info">
            <h4>부산 바다 패키지</h4>
            <p>맛집 + 바다 + 숙소 올인원</p>
          </div>
          <img
            src="/assets/images/plan3.jpg"
            className="card-img"
            alt="부산 여행"
          />
        </div>
      </div>
    </section>
  );
}