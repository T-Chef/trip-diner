import { useEffect, useRef } from "react";
import "../../styles/page/home/Section3.css";

export default function Section3({ sectionRef }) {
  const paperBg = process.env.PUBLIC_URL + "/assets/textures/paper.jpg";

  const fadeRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add("show");
        });
      },
      { threshold: 0.25 }
    );

    fadeRefs.current.forEach(el => el && observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="section-box recommend-section"
      ref={sectionRef}
      style={{
        backgroundImage: `url(${paperBg})`,
      }}
    >
      <div className="recommend-grid">
        {/* 왼쪽 컬럼*/}
        <div className="left-col fade-item" ref={el => (fadeRefs.current[0] = el)}>
          <h4 className="small-blue">여행 정보 · 상품</h4>
          <h1 className="big-title">
            나의 여행 취향 어디까지<br />알고 있나요?
          </h1>
          <p className="sub-desc">내 성향 기반 여행지 추천</p>

          <div className="recommend-list">

            <div className="item-card fade-item" ref={el => (fadeRefs.current[1] = el)}>
              <img src="/assets/images/reco1.jpg" className="item-thumb" alt="랜드마크 사랑 여행자" />
              <div className="item-info">
                <h4>랜드마크 사랑 여행자</h4>
                <p>유명한 곳은 다 가봐야지!</p>
              </div>
            </div>

            <div className="item-card fade-item" ref={el => (fadeRefs.current[2] = el)}>
              <img src="/assets/images/reco1.jpg" className="item-thumb" alt="모험가 여행자" />
              <div className="item-info">
                <h4>모험가 여행자</h4>
                <p>여행의 묘미는 체험!</p>
              </div>
            </div>

            <div className="item-card fade-item" ref={el => (fadeRefs.current[3] = el)}>
              <img src="/assets/images/reco1.jpg" className="item-thumb" alt="힐링 여행자" />
              <div className="item-info">
                <h4>힐링 여행자</h4>
                <p>오늘만은 쉬고 싶어!</p>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 컬럼 */}
          <div className="right-list fade-item" ref={el => (fadeRefs.current[4] = el)}>

            {/* 1번 카드 */}
            <div className="product-card">
              <img src="/assets/images/product1.jpg" className="product-thumb" alt="전주 상품 이미지"/>
              <h3 className="product-title">전주에 왔다면 꼭 가야 하는 곳</h3>
              <p className="product-sub">가이드 • 전주</p>
              <div className="tag">#참고할 만한 가이드</div>
            </div>

            {/* 2번 카드 */}
            <div className="product-card">
              <img src="/assets/images/product2.jpg" className="product-thumb" alt="부산 상품 이미지"/>
              <h3 className="product-title">부산 해운대 </h3>
              <p className="product-sub">한국인들이 사랑하는 관광지</p>
              <div className="product-meta">테마파크 • 어트랙션 • 부산</div>
              <div className="tag">#일정에 담은 상품과 연관된 상품</div>
            </div>

            {/* 3번 카드 */}
            <div className="product-card">
              <img src="/assets/images/product3.jpg" className="product-thumb" alt="여수 상품 이미지" />
              <h3 className="product-title">여수 밤바다</h3>
              <p className="product-sub">3성급 • 여수</p>
              <div className="tag">#여수와 함께 많이 찾는 다리</div>
            </div>

          </div>

      </div>
    </section>
  );
}
