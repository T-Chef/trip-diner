import React from "react";
import "../../styles/page/city/AIFilter.css";

export default function AIFilter() {
  return (
    <div className="ai-filter-wrapper">
      
      {/* 지역 선택 */}
      <div className="ai-filter-item">
        <label>지역</label>
        <select>
          <option>전체</option>
        </select>
      </div>

      {/* 구/군 선택 */}
      <div className="ai-filter-item">
        <label>구·군</label>
        <select>
          <option>전체</option>
        </select>
      </div>

      {/* 키워드 선택 */}
      <div className="ai-filter-item">
        <label>키워드</label>
        <select>
          <option>전체</option>
        </select>
      </div>

    </div>
  );
}
