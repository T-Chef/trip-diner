import { useEffect, useRef } from "react";
import "../../styles/page/home/Section2.css";

export default function Section2({ sectionRef }) {
  const paperBg = process.env.PUBLIC_URL + "/assets/textures/paper.jpg";

  const fadeRefs = useRef([]); // 애니메이션 대상들 담기

 useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add("show");
        });
      },
      { threshold: 0.2 }
    );

    fadeRefs.current.forEach(el => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);


  return (
    <section
      className="section-box style-select-section"
      ref={sectionRef}
      style={{
        backgroundImage: `url(${paperBg})`,
      }}
    >
      <div className="style-content-area">
        
        {/* 왼쪽 메인 문구 */}
        <div className="left-main fade-item" ref={el => (fadeRefs.current[0] = el)}>
          <h1 className="main-title fade-up delay-1">어떤 취향이든, 다 맞춰주니까</h1>

          <p className="sub-desc">
            어떤 여행 취향이든 T-chef에게 알려주세요!<br />
            취향에 꼭 맞는 일정을 추천해 드립니다.
          </p>

          <button className="blue-btn">AI 일정 만들어보기</button>
        </div>
        
        {/* 오른쪽 스타일 선택지 */}
        <div className="right-style fade-item" ref={el => (fadeRefs.current[1] = el)}>
          <div className="camera-icon">📷</div>
          <h3 className="right-title">내가 선호하는 여행 스타일은?</h3>
          <p className="small">다중 선택 가능</p>

          <div className="style-chips">
            <button>체험, 활동적</button>
            <button>유명 관광지</button>
            <button className="selected">여유롭게 힐링</button>
            <button>문화, 예술, 역사</button>
            <button>관광보다 맛집</button>
          </div>

          <div className="example-card">
            <img
              src="/assets/images/plan.jpg"
              className="example-thumb"
              alt="여행 일정 예시"
            />

            <div className="card-text">
              <h4>부산, 3박 4일 여행 완성</h4>
              <p>AI 맞춤 일정으로 떠나보세요!</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
