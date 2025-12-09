import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/page/city/CityListItem.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function CityListItem({ index, item }) {
  const [liked, setLiked] = useState(false);

  // 초기 좋아요 로드
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    setLiked(saved.includes(item.contentId));
  }, [item.contentId]);

  /* -------------------------------------------------------
     🔸 파티클 생성 함수
  ------------------------------------------------------- */
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

  /* -------------------------------------------------------
     🔥 좋아요 토글
  ------------------------------------------------------- */
  const toggleLike = async (e) => {
    e.stopPropagation();

    const newLiked = !liked;
    setLiked(newLiked);

    const btn = e.currentTarget;

    // 파티클은 좋아요가 ON될 때만 실행
    if (newLiked) {
      createParticles(btn);
    }

    // LOCAL 저장
    const saved = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    const updated = newLiked
      ? [...saved, item.contentId]
      : saved.filter((id) => id !== item.contentId);

    localStorage.setItem("likedPlaces", JSON.stringify(updated));

    // 서버 저장
    try {
      await axios.post(`${API_BASE}/place/like`, {
        contentId: item.contentId,
        liked: newLiked,
        userId: 1, // TODO: 실제 로그인 아이디로 변경
      });
    } catch (err) {
      console.error("좋아요 저장 실패", err);
    }
  };

  return (
    <div className="city-list-item">
      <div className="city-index">{index}</div>

      <div className="city-info">
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

        <p className="desc">{item.overview || "설명 없음"}</p>

        <p className="address">📍 {item.address || "주소 정보 없음"}</p>
      </div>

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
