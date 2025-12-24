// front/src/components/city/CityListItem.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { placeLikesApi } from "../../../api/placeLikesApi";
import "../../../styles/side/city/CityListItem.css";

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
function CityListItemReal({ index, item, userId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [liked, setLiked] = useState(false);
  const key = `likedPlaces_${userId || "guest"}`;

  const thumbSrc = (item && item.image) || DEFAULT_THUMB;

  const contentId = item?.contentId;

  useEffect(() => {
  if (!contentId) return;

  const refresh = () => {
    const saved = JSON.parse(localStorage.getItem(key) || "[]").map(String);
    setLiked(saved.includes(String(contentId)));
  };

  refresh(); 

  window.addEventListener("placeLikesChanged", refresh);
  return () => window.removeEventListener("placeLikesChanged", refresh);
}, [contentId, key]);

  
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

  if (newLiked) createParticles(e.currentTarget);

  // 로그인 안 했으면: 로컬만 저장 + 이벤트 발사 (api파일 안 거치니까)
  if (!userId) {
    const key = `likedPlaces_guest`;
    const saved = JSON.parse(localStorage.getItem(key) || "[]").map(String);
    const cid = String(item.contentId);
    const updated = newLiked
      ? Array.from(new Set([...saved, cid]))
      : saved.filter((id) => id !== cid);

    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("placeLikesChanged", { detail: { userId: "guest" } }));
    return;
  }

  // 로그인 상태면: 서버 + 로컬 + 이벤트는 placeLikesApi가 다 처리
  try {
    await placeLikesApi.toggle({
      contentId: item.contentId,
      liked: newLiked,
      userId,
      title: item.title,
      address: item.address,
      image: item.image,
      lat: item.latitude,
      lng: item.longitude,
      category: item.category,
      cityId: null,
      contentTypeId: item.contentTypeId,
    });
  } catch (err) {
    console.error("좋아요 저장 실패", err);
    // 실패 롤백
    setLiked(!newLiked);
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
