import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import "../../styles/page/home/Section2.css";
import MenuSpread from "./MenuSpread";

export default function Section2({ sectionRef }) {
  const fadeRefs = useRef([]);
  const navigate = useNavigate(); 

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("show");
        });
      },
      { threshold: 0.2 }
    );

    fadeRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const goAiSchedule = () => {
    navigate("/trip"); 
  };

  return (
    <MenuSpread
      sectionRef={sectionRef}
      className="schedule-section"
      leftLabel="TRIP · DINER — 일정표"
      rightLabel="TRIP · DINER — 추천"
      left={
        <div
          className="schedule-left fade-item"
          ref={(el) => (fadeRefs.current[0] = el)}
        >
          <p className="s1-kicker">AI 일정표</p>

          <h2 className="s1-title">여행을 한번에</h2>

          <p className="s1-desc">
            여행 전에 계획하고 여행 중에는 수정하고
            <br />
            Trip-Diner는 한 화면에서 끝낼 수 있어요.
          </p>

          <ul className="s1-checks">
            <li>누구와, 언제, 전국 어디든</li>
            <li>내가 가고 싶은 여행 테마까지</li>
            <li>T-chef가 내 취향에 맞게 찾아주니까</li>
          </ul>

          <button type="button" className="s1-btn" onClick={goAiSchedule}>
            일정 살펴보기
          </button>
        </div>
      }
      right={
        <div
          className="schedule-right right-style fade-item"
          ref={(el) => (fadeRefs.current[1] = el)}
        >
          <div className="camera-icon">📷</div>
          <h3 className="right-title">내가 선호하는 여행 스타일은?</h3>
          <p className="small">다중 선택 가능</p>

          <div className="style-chips">
            <button type="button">체험, 활동적</button>
            <button type="button">유명 관광지</button>
            <button type="button" className="selected">
              여유롭게 힐링
            </button>
            <button type="button">문화, 예술, 역사</button>
            <button type="button">관광보다 맛집</button>
          </div>

          <div className="example-card">
            <img
              src="/assets/images/plan.jpg"
              className="example-thumb"
              alt="여행 일정 예시"
            />
          </div>
        </div>
      }
    />
  );
}
