import { useEffect, useRef } from "react";
import "../../styles/page/home/Section1.css";

export default function Section1({ sectionRef }) {
  const paperBg = process.env.PUBLIC_URL + "/assets/textures/paper.jpg";
  const cardRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("show");
          }
        });
      },
      { threshold: 0.3 }
    );

    cardRefs.current.forEach(card => card && observer.observe(card));

    return () => observer.disconnect();
  }, []);


  return (
    <section
      className="section-box intro-section"
      ref={sectionRef}
      style={{
        backgroundImage: `url(${paperBg})`,
      }}
    >
      <div className="intro-left">
        <p className="intro-badge">일정 생성 · 관리</p>

        <h2 className="intro-title">
          내가 가고 싶은 여행 테마,
          <br />T-chef로 간편하게
        </h2>

        <p className="intro-subtitle">여행을 한눈에, 그리고 한 번에!</p>

        <p className="intro-desc">
          내가 가고 싶은 곳, 하고 싶은 곳 복잡하게 정하지 않고<br />
          T-chef가 다 해주니까!
        </p>

        <ul className="intro-list">
          <li>✔ 다녀온 사람들의 후기</li>
          <li>✔ 나의 스타일을 맞춰주는 여행</li>
          <li>✔ 후기 공유하는 게시판</li>
          <li>✔ 각 지역의 이벤트도 한눈에</li>
        </ul>

        <button className="intro-cta-btn">일정 살펴보기</button>
      </div>

      <div className="intro-right">
        <div className="intro-card card1" ref={el => (cardRefs.current[0] = el)}>
          <span className="card-num">1</span>
          <div className="card-info">
            <h4>전주 한옥마을</h4>
            <p>전통 감성과 먹거리의 성지</p>
          </div>
          <img src="/assets/images/card1.jpg" className="card-img" alt="전주 한옥마을" />
        </div>

        <div className="intro-card card2" ref={el => (cardRefs.current[1] = el)}>
          <span className="card-num">2</span>
          <div className="card-info">
            <h4>여수 밤바다</h4>
            <p>감성 바다가 만나는 힐링 스팟</p>
          </div>
          <img src="/assets/images/card2.jpg" className="card-img" alt="여수 밤바다" />
        </div>

        <div className="intro-card card3" ref={el => (cardRefs.current[2] = el)}>
          <span className="card-num">3</span>
          <div className="card-info">
            <h4>부산 해운대</h4>
            <p>바다·숙소·맛집이 모두 모인 여행지</p>
          </div>
          <img src="/assets/images/card3.jpg" className="card-img" alt="부산 해운대" />
        </div>

        <div className="intro-card card4" ref={el => (cardRefs.current[3] = el)}>
          <span className="card-num">4</span>
          <div className="card-info">
            <h4>경주 불국사</h4>
            <p>유네스코 문화유산</p>
          </div>
          <img src="/assets/images/card4.jpg" className="card-img" alt="경주 불국사" />
        </div>
      </div>
    </section>
  );
}
