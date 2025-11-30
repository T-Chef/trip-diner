import React from "react";
import "../../../styles/side/mypage/Favorites.css";

export default function Favorites() {
  const sampleFavorites = [
    "오사카 구로몬 시장",
    "부산 감천문화마을",
    "제주 협재 해수욕장",
    "서울 광장시장",
  ];

  return (
    <div className="favorites-wrapper">
      <h2>즐겨찾기 목록</h2>

      <ul>
        {sampleFavorites.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
