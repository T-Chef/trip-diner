import "../../styles/page/home/Hero.css"

export default function Hero({ heroRef }) {
  return (
    <section className="hero">
      <img src="/assets/images/main.png" className="hero-img" alt="메인 배너" />

      <div className="hero-content" ref={heroRef}>
        <h1 className="hero-title">
          보는 순간 설레는
          <br /> 여행 메뉴판
        </h1>

        <p className="hero-desc">
          당신의 취향을 맛보고 만드는 여행 코스
          <br /> Trip-Diner와 함께 특별한 여행을 시작하세요
        </p>
      </div>
    </section>
  );
}