import React from "react";
import CityListItem from "./CityListItem";

import "../../styles/page/city/CityList.css";

export default function CityList({ items = [] }) {
  return (
    <div className="city-list-container">
      {items.length === 0 && (
        <div className="city-list-empty">데이터 준비중입니다…</div>
      )}

      {items.map((item, idx) => (
        <CityListItem key={item.id} index={idx + 1} item={item} />
      ))}
    </div>
  );
}
