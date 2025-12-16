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

    cardRefs.current.forEach((el) => el && observer.observe(el));
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
      <div className="section2-left">
        <p className="label">AI 일정표</p>

        <h2 className="title">
          여행을 한눈에,
          <br />
          그리고 한 번에!
        </h2>

        <p className="desc">
          여행 전에 계획하고 여행 중에는 수정하고
          <br />
          Trip-Dinner는 한 화면에서 끝낼 수 있어요.
        </p>

        <ul className="bullet-list">
          <li>✓ 누구와, 언제, 전국 어디든</li>
          <li>✓ 내가 가고 싶은 여행 테마까지</li>
          <li>✓ T-chef가 내 취향에 맞게 찾아주니까</li>
        </ul>

        <button className="cta-btn">일정 살펴보기</button>
      </div>

      {/* RIGHT TIMELINE */}
      <div className="section2-right">
        {[
          {
            n: 1,
            title: "서울",
            sub: "서울1",
            img: "/assets/images/seoul/seoul1.jpg",
          },
          {
            n: 2,
            title: "서울",
            sub: "서울2",
            img: "/assets/images/seoul/seoul2.jpg",
          },
          {
            n: 3,
            title: "서울",
            sub: "서울3",
            img: "/assets/images/seoul/seoul3.jpg",
          },
        ].map((item, idx) => (
          <div
            className="timeline-row fade-item"
            ref={(el) => (cardRefs.current[idx] = el)}
            key={idx}
          >
            <div className="dot">{item.n}</div>

            <div className="timeline-card">
              <div className="card-text">
                <h4>{item.title}</h4>
                <p>{item.sub}</p>
              </div>

              <img src={item.img} className="card-thumb" alt="" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}