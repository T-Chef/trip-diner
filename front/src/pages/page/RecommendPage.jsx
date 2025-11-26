import React from "react";
import "../../styles/page/RecommendPage.css";

export default function RecommendPage() {
  return (
    <div className="recommend-wrapper">

      <div className="content-area">

        {/* TITLE AREA */}
        <div className="title-area">
          <h4 className="small-blue">여행 정보 · 상품</h4>

          <h1 className="big-title">
            나의 여행 취향 어디까지<br />알고 있나요?
          </h1>

          <p className="sub-desc">
            내 성향에 따라 추천해 주는 여행지, 이벤트
          </p>
        </div>

        {/* LEFT LISTS */}
        <section className="left-recommend">
          <div className="left-item">
            <h4>랜드마크를 사랑한 여행자</h4>
            <p>유명한 곳은 일단 다 가봐야 해!</p>
          </div>

          <div className="left-item">
            <h4>다양한 경험을 즐기는 모험가</h4>
            <p>여행의 묘미는 체험이지!</p>
          </div>

          <div className="left-item">
            <h4>오늘만큼은 힐링 하고 싶어</h4>
            <p>일상에서 벗어나 푹 쉬자!</p>
          </div>
        </section>

        {/* RIGHT IMAGE CARDS */}
        <section className="right-cards">
          <div className="big-card">경주 사진</div>

          <div className="small-card-list">
            <div className="small-card">부산 겨울</div>
            <div className="small-card">제주</div>
          </div>
        </section>

      </div>
    </div>
  );
}
