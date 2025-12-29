import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import "../../styles/page/home/Section3.css";
import MenuSpread from "./MenuSpread";

export default function Section3({ sectionRef }) {
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

  const goBoard = () => navigate("/board");

  const reviews = [
    {
      name: "준성",
      avatar: "/assets/images/profile1.png",
      rating: 5,
      date: "2025.12.10",
      title: "부산 2박3일, 동선 완벽했어요",
      text: "AI 일정표로 뽑은 코스 그대로 갔는데 이동이 너무 편했고 맛집도 실패 없었어요. 다음에도 무조건 사용!",
      tags: ["#부산", "#커플여행", "#맛집"],
      thumb: "/assets/images/review1.jpg",
    },
    {
      name: "진호",
      avatar: "/assets/images/profile2.png",
      rating: 4,
      date: "2025.12.13",
      title: "전주 감성 코스 추천 굿",
      text: "한옥마을 + 카페 + 야경까지 테마가 딱 맞게 나와서 만족. 일정 수정도 쉬워서 여행 중에도 계속 업데이트했어요.",
      tags: ["#전주", "#감성", "#한옥"],
      thumb: "/assets/images/review2.jpg",
    },
    {
      name: "서희",
      avatar: "/assets/images/profile3.png",
      rating: 5,
      date: "2025.12.18",
      title: "강릉 힐링, 사진 스팟이 미쳤음",
      text: "바다/카페 위주로 추천받았는데 분위기 좋은 곳만 골라줘서 좋았어요. 후기 보면서 코스 고르는 재미도 있었고요!",
      tags: ["#강릉", "#힐링", "#카페"],
      thumb: "/assets/images/review3.jpg",
    },
  ];

  const renderStars = (count) =>
    "★★★★★".slice(0, count) + "☆☆☆☆☆".slice(0, 5 - count);

  return (
    <MenuSpread
      sectionRef={sectionRef}
      size="sm"
      className="review-section"
      leftLabel="TRIP · DINER — 후기"
      rightLabel="TRIP · DINER — 둘러보기"
      left={
        <div
          className="review-left fade-item"
          ref={(el) => (fadeRefs.current[0] = el)}
        >
          <p className="rv-kicker">여행 후기</p>

          <h2 className="rv-title">
            후기로 선택해
          </h2>

          <p className="rv-sub">실제 여행자들의 동선 · 맛집 · 사진 스팟</p>

          <p className="rv-desc">
            후기에서 마음에 드는 코스를 저장하고
            <br />
            내 일정표로 바로 가져와 편하게 시작하세요.
          </p>

          <ul className="rv-checks">
            <li>실제 여행 동선 기반</li>
            <li>별점 · 태그로 빠르게 탐색</li>
            <li>저장 후 일정표로 가져오기</li>
          </ul>

          <button type="button" className="rv-btn" onClick={goBoard}>
            후기 둘러보기
          </button>
        </div>
      }
      right={
        <div className="review-right">
          {reviews.map((r, idx) => (
            <article
              key={idx}
              className="review-card fade-item"
              ref={(el) => (fadeRefs.current[idx + 1] = el)}
            >
              <div className="rv-top">
                <div className="rv-user">
                  <img
                    className="rv-avatar"
                    src={r.avatar}
                    alt={`${r.name} 프로필`}
                  />
                  <div className="rv-user-meta">
                    <div className="rv-name-row">
                      <strong className="rv-name">{r.name}</strong>
                      <span className="rv-date">{r.date}</span>
                    </div>
                    <div className="rv-rating" aria-label={`별점 ${r.rating}점`}>
                      <span className="rv-stars">{renderStars(r.rating)}</span>
                      <span className="rv-score">{r.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <span className="rv-badge">BEST</span>
              </div>

              <div className="rv-body">
                <div className="rv-text">
                  <h4 className="rv-card-title">{r.title}</h4>
                  <p className="rv-card-desc">{r.text}</p>
                  <div className="rv-tags">
                    {r.tags.map((t, i) => (
                      <span key={i} className="rv-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <img className="rv-thumb" src={r.thumb} alt="후기 썸네일" />
              </div>
            </article>
          ))}
        </div>
      }
    />
  );
}