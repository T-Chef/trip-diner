import React from "react";
import "./App.css";

function App() {
  return (
    <div>
      {/* 헤더 */}
      <header>
        <div className="logo">Travel - chef</div>
        <nav>
          <ul>
            <li><a href="#">홈</a></li>
            <li><a href="#">여행상품</a></li>
            <li><a href="#">로그인</a></li>
            <li><a href="#">문의하기</a></li>
          </ul>
        </nav>
      </header>

      {/* 메인 배너 */}
      <section className="hero">
        <h1>당신의 특별한 여행, T - chef와 함께</h1>
        <p>국내 맞춤형 여행 전문</p>
        <a href="#" className="btn">지금 여행 상품 보기</a>
      </section>

      {/* 추천 여행지 */}
      <section className="tours">
        <h2>추천 여행지</h2>
        <div className="tour-list">
          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/paris.jpg`} alt="파리 여행" />
            <h3>프랑스 파리</h3>
            <p>낭만의 도시에서 잊지 못할 추억을.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/jeju.jpg`} alt="제주 여행" />
            <h3>제주도 여행</h3>
            <p>자연과 함께하는 힐링 스테이.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/tokyo.jpg`} alt="도쿄 여행" />
            <h3>일본 도쿄</h3>
            <p>도시의 세련됨과 문화의 만남.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/bangkok.jpg`} alt="방콕 여행" />
            <h3>태국 방콕</h3>
            <p>이국적인 야시장과 맛의 도시.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/sydney.jpg`} alt="시드니 여행" />
            <h3>호주 시드니</h3>
            <p>자유로운 해변 도시의 매력.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/hanoi.jpg`} alt="하노이 여행" />
            <h3>베트남 하노이</h3>
            <p>고풍스러운 분위기와 거리 음식 천국.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/seoul.jpg`} alt="서울 여행" />
            <h3>한국 서울</h3>
            <p>전통과 현대가 어우러진 글로벌 도시.</p>
          </div>

          <div className="tour-card">
            <img src={`${process.env.PUBLIC_URL}/images/dubai.jpg`} alt="두바이 여행" />
            <h3>두바이</h3>
            <p>사막 위의 미래 도시, 럭셔리의 끝판왕.</p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer>
        <p>비트교육센터</p>
      </footer>
    </div>
  );
}

export default App;
