import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/page/city/CityListItem.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function CityListItem({ index, item }) {
  const [liked, setLiked] = useState(false);

  // 🔸 초기 좋아요
  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    setLiked(savedLikes.includes(item.contentId));
  }, [item.contentId]);

  // 파티클 
  const createParticles = (target) => {
    const count = 6;
    const container = target.parentElement;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement("span");
      particle.className = "particle";

      const angle = (Math.PI * 2 * i) / count;
      particle.style.setProperty("--dx", `${Math.cos(angle) * 22}px`);
      particle.style.setProperty("--dy", `${Math.sin(angle) * 22}px`);

      container.appendChild(particle);

      setTimeout(() => particle.remove(), 700);
    }
  };

  // 🔥 좋아요 토글
  const toggleLike = async (e) => {
    e.stopPropagation();
    const newLiked = !liked;

    const btn = e.currentTarget;
    btn.classList.remove("liked", "unliked");

    if (newLiked) {
      btn.classList.add("liked");
      createParticles(btn);
    } else {
      btn.classList.add("unliked");
    }

    // 1) 프론트 localStorage 업데이트
    const savedLikes = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    const updated = newLiked
      ? [...savedLikes, item.contentId]
      : savedLikes.filter((id) => id !== item.contentId)

    localStorage.setItem("likedPlaces", JSON.stringify(updated));
    setLiked(newLiked);

    // 2) 서버에도 좋아요 상태 전송
    try {
      await axios.post(`${API_BASE}/place/like`, {
        contentId: item.contentId,
        liked: newLiked,
        userId: 1  
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
          <div className="like-container">
            <button 
              className={`like-btn ${liked ? "liked" : ""}`} 
              onClick={toggleLike}
            >
              {liked ? "❤️" : "🤍"}
            </button>
          </div>
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
