// front/src/components/city/CityListItem.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../../styles/page/city/CityListItem.css";

const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:4000/api";
const DEFAULT_THUMB =
  process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg";

/**
 * entry 컴포넌트 – isSkeleton 여부에 따라 분기
 */
export default function CityListItem(props) {
  const { isSkeleton, index } = props;

  if (isSkeleton) {
    return <CityListItemSkeleton index={index} />;
  }

  return <CityListItemReal {...props} />;
}

/* -------------------------------------------------------
   🔥 실제 카드 컴포넌트
------------------------------------------------------- */
function CityListItemReal({ index, item }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [liked, setLiked] = useState(false);

  const thumbSrc = (item && item.image) || DEFAULT_THUMB;

  // 초기 좋아요 로드
  useEffect(() => {
    if (!item || !item.contentId) return;

    const saved = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    setLiked(saved.includes(item.contentId));
  }, [item]);

  if (!item) return null;

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

    if (newLiked) {
      // 좋아요 ON일 때만 파티클
      createParticles(e.currentTarget);
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

  // 개요 텍스트 정리(HTML 태그 제거 + 비어있으면 "설명 없음")
  const cleanOverview = (() => {
    if (!item.overview || typeof item.overview !== "string") return "설명 없음";
    const stripped = item.overview.replace(/<[^>]+>/g, "").trim();
    return stripped || "설명 없음";
  })();

  /* -------------------------------------------------------
     🔥 카드 클릭 → 상세 페이지 이동 (쿼리 유지)
  ------------------------------------------------------- */
  const handleClick = () => {
    // 현재 /city?area=6&sigungu=23&keyword=... 같은 쿼리 유지
    const params = new URLSearchParams(location.search);
    // type 쿼리 추가/갱신
    params.set("type", item.contentTypeId);

    navigate(`/place/${item.contentId}?${params.toString()}`, {
      state: {
        basePlace: item,
        from: location, // ✅ 나중에 뒤로 갈 때 사용 가능
      },
    });
  };

  return (
    <div className="city-list-item" onClick={handleClick}>
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

        <p className="desc">{cleanOverview}</p>

        <p className="address">📍 {item.address || "주소 정보 없음"}</p>
      </div>

      <div className="city-thumb">
        <img
          src={thumbSrc}
          alt={item.title}
          onError={(e) => {
            // 기본 이미지도 깨졌을 때는 텍스트로 대체
            if (!e.target.src.includes("default-thumb.jpg")) {
              e.target.src = DEFAULT_THUMB;
              return;
            }
            e.target.style.display = "none";
            e.target.parentElement.textContent = "No Image";
          }}
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   🔹 스켈레톤 컴포넌트
------------------------------------------------------- */
function CityListItemSkeleton({ index }) {
  return (
    <div className="city-list-item city-list-item-skeleton">
      <div className="city-index skeleton-block" />

      <div className="city-info">
        <div className="skeleton-line title" />
        <div className="skeleton-line text" />
        <div className="skeleton-line meta" />
      </div>

      <div className="city-thumb skeleton-block" />
    </div>
  );
}
