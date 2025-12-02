import React from "react";
import "../../styles/page/city/ReviewCard.css";

export default function ReviewCard({ item }) {
  return (
    <div className="review-card">
      {/* 썸네일 영역 */}
      <div className="review-thumb">
        <img 
          src={item?.thumb || "/default-thumb.jpg"} 
          alt="여행 후기"
        />
      </div>

      {/* 내용 */}
      <div className="review-info">
        <div className="user">
          <img 
            className="user-img" 
            src={item?.userImg || "/default-user.png"} 
            alt="유저"
          />
          <span className="user-name">{item?.userName || "작성자"}</span>
          <span className="days">
            · {item?.days || "2박 3일"}
          </span>
        </div>

        <h3 className="review-title">
          {item?.title || "여행 후기 제목"}
        </h3>

        <p className="review-desc">
          {item?.summary || "간단한 후기 내용이 들어갑니다…"}
        </p>
      </div>
    </div>
  );
}
