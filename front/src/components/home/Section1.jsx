import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/page/home/Section1.css";
import MenuSpread from "./MenuSpread";

export default function Section1({ sectionRef }) {
  const fadeRefs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("show");
        });
      },
      { threshold: 0.22 }
    );

    fadeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

   const goCity = () => {
    navigate("/city");
  };

  return (
    <MenuSpread
      sectionRef={sectionRef}
      size="sm"
      className="city-section"
      leftLabel="TRIP · DINER — 도시 정보"
      rightLabel="TRIP · DINER — 추천"
      left={
        <div className="s3-left fade-item" ref={(el) => (fadeRefs.current[0] = el)}>
          <p className="s3-kicker">도시별 여행 정보</p>

          <h2 className="s3-title">전국 여행을 한눈에</h2>

          <p className="s3-sub">명소 · 축제 · 가이드</p>

          <p className="s3-desc">
            인기 여행지의 핵심 정보만 깔끔하게 정리했어요.
            <br />
            도시 분위기부터 추천 코스까지 한눈에 확인하세요.
          </p>

          <ul className="s3-checks">
            <li>내가 가고 싶은 지역 정보</li>
            <li>Trip - Diner가 추천하는 코스</li>
            <li>핵심만 정리한 여행 정보</li>
          </ul>

          <button type="button" className="s3-btn" onClick={goCity}>
            도시 둘러보기
          </button>
        </div>
      }
      right={
        <div className="s3-right">
          <div className="city-row fade-item" ref={(el) => (fadeRefs.current[1] = el)}>
            <span className="city-num">1</span>
            <div className="city-card">
              <div className="city-info">
                <h4>서울</h4>
                <p>전통과 현대의 조화</p>
              </div>
              <div className="city-thumbs">
                <img src="/assets/images/seoul/seoul1.jpg" alt="서울1" />
                <img src="/assets/images/seoul/seoul2.jpg" alt="서울2" />
                <img src="/assets/images/seoul/seoul3.jpg" alt="서울3" />
              </div>
            </div>
          </div>

          <div className="city-row fade-item" ref={(el) => (fadeRefs.current[2] = el)}>
            <span className="city-num">2</span>
            <div className="city-card">
              <div className="city-info">
                <h4>부산</h4>
                <p>바다와 미식의 도시</p>
              </div>
              <div className="city-thumbs">
                <img src="/assets/images/busan/busan1.jpg" alt="부산1" />
                <img src="/assets/images/busan/busan2.jpg" alt="부산2" />
                <img src="/assets/images/busan/busan3.jpg" alt="부산3" />
              </div>
            </div>
          </div>

          <div className="city-row fade-item" ref={(el) => (fadeRefs.current[3] = el)}>
            <span className="city-num">3</span>
            <div className="city-card">
              <div className="city-info">
                <h4>전주</h4>
                <p>한옥 감성 여행지</p>
              </div>
              <div className="city-thumbs">
                <img src="/assets/images/jeonju/jeonju1.jpg" alt="전주1" />
                <img src="/assets/images/jeonju/jeonju2.jpg" alt="전주2" />
                <img src="/assets/images/jeonju/jeonju3.jpg" alt="전주3" />
              </div>
            </div>
          </div>

          <div className="city-row fade-item" ref={(el) => (fadeRefs.current[4] = el)}>
            <span className="city-num">4</span>
            <div className="city-card">
              <div className="city-info">
                <h4>강릉</h4>
                <p>바다와 자연의 휴식</p>
              </div>
              <div className="city-thumbs">
                <img src="/assets/images/gangneung/gangneung1.jpg" alt="강릉1" />
                <img src="/assets/images/gangneung/gangneung2.jpg" alt="강릉2" />
                <img src="/assets/images/gangneung/gangneung3.jpg" alt="강릉3" />
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
}