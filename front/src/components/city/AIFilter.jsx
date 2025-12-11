// src/components/city/AIFilter.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/page/city/AIFilter.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function AIFilter({ onFilterChange, defaultAreaCode }) {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // 부모에게 필터를 넘길 준비가 됐는지 여부
  const [isReady, setIsReady] = useState(false);

  /* -------------------------
     🔹 도시 목록 가져오기
  ------------------------- */
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tour/cities`);
        setCities(res.data || []);
      } catch (err) {
        console.error("⚠ 도시 목록 불러오기 실패:", err);
        setCities([]);
        setIsReady(true); // 실패해도 최소한 필터는 동작하도록
      }
    };

    fetchCities();
  }, []);

  /* -------------------------
     🔹 도시 목록 로딩 후 기본 도시 선택
        (defaultAreaCode 기준)
  ------------------------- */
  useEffect(() => {
    if (!cities.length) return; // 아직 로딩 안 됨

    // 이미 사용자가 선택했으면 덮어쓰지 않음
    if (selectedCity) {
      setIsReady(true);
      return;
    }

    // defaultAreaCode가 없는 경우
    if (!defaultAreaCode) {
      setIsReady(true);
      return;
    }

    const defaultCity = cities.find(
      (c) => Number(c.areaCode) === Number(defaultAreaCode)
    );

    if (defaultCity) {
      // ✅ 기본 도시 칩 선택
      setSelectedCity(defaultCity);
    }

    setIsReady(true);
  }, [cities, defaultAreaCode, selectedCity]);

  /* -------------------------
     🔹 도시 선택 → 시군구 목록 가져오기
  ------------------------- */
  useEffect(() => {
    if (!selectedCity) {
      setDistricts([]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tour/areas`, {
          params: { areaCode: selectedCity.areaCode },
        });
        setDistricts(res.data || []);
      } catch (err) {
        console.error("⚠ 시군구 목록 불러오기 실패:", err);
        setDistricts([]);
      }
    };

    fetchDistricts();
  }, [selectedCity]);

  /* -------------------------
     🔹 부모로 필터 전달
        (CityMain의 setFilter)
  ------------------------- */
  useEffect(() => {
    if (!isReady) return;

    onFilterChange((prev) => ({
      ...prev,
      areaCode: selectedCity?.areaCode || null,
      sigunguCode: selectedDistrict?.sigunguCode || null,
    }));
  }, [selectedCity, selectedDistrict, onFilterChange, isReady]);

  return (
    <div className="ai-filter-wrapper">
      {/* 광역시/도 해시태그 */}
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

      {/* 시군구 */}
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
