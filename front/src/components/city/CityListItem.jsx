import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/page/city/CityListItem.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function CityListItem({ index, item }) {
  const [liked, setLiked] = useState(false);

  // 🔸 초기 로드 시 localStorage 좋아요 상태 불러오기
  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    setLiked(savedLikes.includes(item.contentId));
  }, [item.contentId]);

  // 🔥 좋아요 토글
  const toggleLike = async (e) => {
    e.stopPropagation();

    const newLiked = !liked;

    // 1) 프론트 localStorage 업데이트
    const savedLikes = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    let updated;

    if (newLiked) {
      updated = [...savedLikes, item.contentId];
    } else {
      updated = savedLikes.filter(id => id !== item.contentId);
    }

    localStorage.setItem("likedPlaces", JSON.stringify(updated));
    setLiked(newLiked);

    // 2) 서버에도 좋아요 상태 전송
    try {
      await axios.post(`${API_BASE}/place/like`, {
        contentId: item.contentId,
        liked: newLiked,
        userId: 1  // TODO: 실제 로그인된 사용자 ID로 변경
      });
    } catch (err) {
      console.error("좋아요 저장 실패", err);
    }
  };

  return (
    <div className="city-list-item">

      {/* 번호 */}
      <div className="city-index">{index}</div>

      {/*텍스트 정보 */}
      <div className="city-info">
        {/* 제목 + 하트 */}
        <div className="title-row">
          <h3>{item.title}</h3>

          <button className="like-btn" onClick={toggleLike}>
            {liked ? "❤️" : "🤍"}
          </button>
        </div>

        {/* 설명 */}
        <p className="desc">
          {item.overview || "설명 없음"}
        </p>

        {/* 주소 */}
        <p className="address">
          📍 {item.address || "주소 정보 없음"}
        </p>
      </div>

      {/* 썸네일 */}
      <div className="city-thumb">
        {item.image ? (
          <img src={item.image} alt={item.title} />
        ) : (
          <div className="no-img">No Image</div>
        )}
      </div>
    </div>
  );
}
