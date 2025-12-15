import React from "react";
import "../../styles/page/city/CityListItem.css";

export default function CityListItem({
  index,
  item,
  onLikeToggle,
  user,
  isLiked,
}) {
  const handleLikeClick = (e) => {
    e.stopPropagation();

    if (!user?.user_id) {
      alert("로그인 후 좋아요 가능합니다.");
      return;
    }

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
      !isLiked,
      user.user_id
    );
  };

  return (
    <div className="city-list-item">
      <div className="city-index">{index}</div>

      <div className="city-info">
        <div className="title-row">
          <h3>{item.title}</h3>
          <button className="like-btn" onClick={handleLikeClick}>
            {isLiked ? "❤️" : "🤍"}
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
