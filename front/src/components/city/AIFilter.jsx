import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/page/city/AIFilter.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function AIFilter({ onFilterChange }) {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // 도시 가져오기
  useEffect(() => {
    axios.get(`${API_BASE}/tour/cities`).then(res => setCities(res.data));
  }, []);

  // 도시 선택 → 구/군 목록 불러오기
  useEffect(() => {
    if (!selectedCity) return;

    axios
      .get(`${API_BASE}/tour/areas`, {
        params: { areaCode: selectedCity.areaCode },
      })
      .then((res) => setDistricts(res.data));
  }, [selectedCity]);

  // 부모로 필터 전달
  useEffect(() => {
    onFilterChange(prev => ({
      ...prev,
      areaCode: selectedCity?.areaCode || null,
      sigunguCode: selectedDistrict?.sigunguCode || null
    }));
  }, [selectedCity, selectedDistrict, onFilterChange]);

  return (
    <div className="ai-filter-wrapper">

      {/* ================================
          상단 지역 선택 (해시태그 UI)
      ================================= */}
      <div className="ai-filter-city-tags">
        {cities.map((city) => (
          <div
            key={city.areaCode}
            className={`city-tag ${
              selectedCity?.areaCode === city.areaCode ? "active" : ""
            }`}
            onClick={() => {
              setSelectedCity(city);
              setSelectedDistrict(null);
            }}
          >
            #{city.name}
          </div>
        ))}
      </div>

      {/* 군/구 리스트 */}
      {selectedCity && (
        <div className="ai-filter-district-grid">
          <div
            className={`district-tag ${selectedDistrict ? "" : "active"}`}
            onClick={() => setSelectedDistrict(null)}
          >
            전체
          </div>

          {districts.map((d) => (
            <div
              key={d.sigunguCode}
              className={`district-tag ${
                selectedDistrict?.sigunguCode === d.sigunguCode ? "active" : ""
              }`}
              onClick={() => setSelectedDistrict(d)}
            >
              {d.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
