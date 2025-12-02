import React from "react";

import "../../styles/page/city/CityListItem.css";

export default function CityListItem({ index, item }) {
  return (
    <div className="city-list-item">

      <div className="city-index">{index}</div>

      <div className="city-info">
        <h3>{item?.name || "여행지 이름"}</h3>
        <p className="desc">{item?.description || "여행지 설명 한 줄"}</p>

        <div className="rating">
          ⭐ {item?.rating || "-"} ({item?.reviewCount || "0"})  
          ♥ {item?.likeCount || "0"}
        </div>

        <div className="category">
          {item?.category || "카테고리"} · {item?.location || "지역"}
        </div>
      </div>

      {/* 이미지 Placeholder */}
      <div className="city-thumb"></div>
    </div>
  );
}
