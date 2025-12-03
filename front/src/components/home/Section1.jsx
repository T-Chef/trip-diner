import { useEffect, useRef } from "react";
import "../../styles/page/home/Section1.css";

export default function Section1({ sectionRef }) {
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
      {/* LEFT */}
      <div className="menu-left">
        <p className="intro-badge">도시별 여행 정보</p>

        <h2 className="intro-title">전국 여행을 한눈에</h2>

        <p className="intro-subtitle">명소 · 축제 가이드</p>

        <p className="intro-desc">
          인기 여행지의 핵심 정보만 깔끔하게 정리했어요.
          <br />
          도시 분위기부터 추천 코스까지 한눈에 확인하세요.
        </p>

        <ul className="intro-list">
          <li>✔ 내가 가고 싶은 지역 정보</li>
          <li>✔ Trip - Dinner가 추천하는 코스</li>
          <li>✔ 핵심만 정리한 여행 정보</li>
        </ul>

        <button className="intro-cta-btn">도시 둘러보기</button>
      </div>

      {/* RIGHT */}
      <div className="menu-right">
        <div className="intro-card" ref={(el) => (cardRefs.current[0] = el)}>
          <span className="card-num">1</span>
          <div className="card-info">
            <h4>서울</h4>
            <p>전통과 현대의 조화</p>
          </div>
          <img src="/assets/images/seoul.jpg" className="card-img" alt="서울" />
        </div>

        <div className="intro-card" ref={(el) => (cardRefs.current[1] = el)}>
          <span className="card-num">2</span>
          <div className="card-info">
            <h4>부산</h4>
            <p>바다와 미식의 도시</p>
          </div>
          <img src="/assets/images/busan.jpg" className="card-img" alt="부산" />
        </div>

        <div className="intro-card" ref={(el) => (cardRefs.current[2] = el)}>
          <span className="card-num">3</span>
          <div className="card-info">
            <h4>전주</h4>
            <p>한옥 감성 여행지</p>
          </div>
          <img
            src="/assets/images/jeonju.jpg"
            className="card-img"
            alt="전주"
          />
        </div>

        <div className="intro-card" ref={(el) => (cardRefs.current[3] = el)}>
          <span className="card-num">4</span>
          <div className="card-info">
            <h4>강릉</h4>
            <p>바다와 자연의 휴식</p>
          </div>
          <img
            src="/assets/images/gangneung.jpg"
            className="card-img"
            alt="강릉"
          />
        </div>
      </div>
    </section>
  );
}
