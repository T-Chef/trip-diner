import React, { useState, useEffect } from "react";
import "../../styles/page/city/CityListItem.css";

export default function CityListItem({ index, item, onLikeToggle, user }) {
  const [liked, setLiked] = useState(false);

  // 좋아요
  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    setLiked(savedLikes.includes(item.contentId));
  }, [item.contentId]);

  const handleLikeClick = (e) => {
    e.stopPropagation();
    const newLiked = !liked;
    setLiked(newLiked);

    const saved = JSON.parse(localStorage.getItem("likedPlaces") || "[]");
    const updated = newLiked
      ? [...saved, item.contentId]
      : saved.filter((id) => id !== item.contentId);

    localStorage.setItem("likedPlaces", JSON.stringify(updated));

    if (onLikeToggle) {
      onLikeToggle(
        {
          contentId: item.contentId,
          title: item.title,
          address: item.address,
          image: item.image,
          overview: item.overview,
          lat: item.latitude,
          lng: item.longitude,
          areaCode: item.areaCode,
        },
        newLiked,
        user?.user_id
      );
    }
  };

  return (
    <div className="city-list-item">
      <div className="city-index">{index}</div>

      <div className="city-info">
        <div className="title-row">
          <h3>{item.title}</h3>

          <button className="like-btn" onClick={handleLikeClick}>
            {liked ? "❤️" : "🤍"}
          </button>
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
