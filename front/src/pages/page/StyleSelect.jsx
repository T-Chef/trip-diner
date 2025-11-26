import React from "react";
import "../../styles/page/StyleSelect.css";

export default function StyleSelect() {
  return (
    <div className="style-wrapper">

      {/* LEFT MAIN TEXT */}
      <section className="left-main">
        <h1 className="main-title">
          어떤 취향이든, 다 맞춰주니까
        </h1>
        <p className="sub-desc">
          어떤 여행 취향이든 T-chef에게 간단히 알려만 주세요. <br />
          <b>T-chef</b>는 여러분 취향에 꼭 맞는 일정을 추천해 드립니다.
        </p>

        <button className="blue-btn">AI일정 만들어보기</button>

        <div className="left-cards">

          <div className="left-card">
            <img src="/images/landmark.jpg" alt="랜드마크" className="left-card-img" />
            <div>
              <h4>랜드마크를 사랑한 여행자</h4>
              <p>유명한 곳은 일단 다 가봐야 해!</p>
            </div>
          </div>

          <div className="left-card">
            <img src="/images/adventure.jpg" alt="모험가" className="left-card-img" />
            <div>
              <h4>다양한 경험을 즐기는 모험가</h4>
              <p>여행의 묘미는 체험이지!</p>
            </div>
          </div>

          <div className="left-card">
            <img src="/images/healing.jpg" alt="힐링" className="left-card-img" />
            <div>
              <h4>오늘만큼은 힐링 하고 싶어</h4>
              <p>일상에서 벗어나 푹 쉬자!</p>
            </div>
          </div>

        </div>
      </section>

      {/* RIGHT STYLE SELECTION */}
      <section className="right-style">
        <div className="camera-icon">📷</div>

        <h3 className="right-title">내가 선호하는 여행 스타일은?</h3>
        <p className="small">다중 선택이 가능해요</p>

        <div className="style-chips">
          <button>체험, 활동적</button>
          <button>유명 관광지</button>
          <button className="selected">여유롭게 힐링</button>
          <button>문화, 예술, 역사</button>
          <button>관광보다 맛집</button>
        </div>

        <div className="example-card">
          <div className="card-image"></div>
          <div className="card-text">
            <h4>부산, 3박 4일 여행 완성</h4>
            <p>T-chef가 알려준 맞춤일정으로 여행을 떠나보세요.</p>
          </div>
        </div>
      </section>

    </div>
  );
}