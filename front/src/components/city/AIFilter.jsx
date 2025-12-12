// src/components/city/AIFilter.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/page/city/AIFilter.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function AIFilter({ 
  onFilterChange,
  defaultAreaCode, 
  defaultSigunguCode 
}) {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // 부모에게 필터를 넘길 준비가 됐는지 여부
  const [isReady, setIsReady] = useState(false);

  // 🔥 URL에서 처음 넘어온 sigunguCode를 고정해서 보관
  const [initialSigunguCode] = useState(
    defaultSigunguCode != null ? Number(defaultSigunguCode) : null
  );
  const [appliedDefaultDistrict, setAppliedDefaultDistrict] = useState(false);

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

    // defaultAreaCode가 없는 경우
    if (!defaultAreaCode) {
      setIsReady(true);
      return;
    }

    // 이미 동일한 도시가 선택되어 있으면 그대로 사용
    if (
      selectedCity &&
      Number(selectedCity.areaCode) === Number(defaultAreaCode)
    ) {
      setIsReady(true);
      return;
    }

    const defaultCity = cities.find(
      (c) => Number(c.areaCode) === Number(defaultAreaCode)
    );

    if (defaultCity) {
      setSelectedCity(defaultCity);
      setSelectedDistrict(null);
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
     🔹 시군구 로딩 후 "처음 URL 기준" 기본 시군구 선택
        - initialSigunguCode를 한 번만 사용
  ------------------------- */
  useEffect(() => {
    if (!districts.length) return;
    if (appliedDefaultDistrict) return;
    if (initialSigunguCode == null) return;

    const def = districts.find(
      (d) => Number(d.sigunguCode) === initialSigunguCode
    );
    if (def) {
      setSelectedDistrict(def);
      setAppliedDefaultDistrict(true);
    }
  }, [districts, initialSigunguCode, appliedDefaultDistrict]);

  /* -------------------------
     🔹 부모로 필터 전달
        (CityMain의 handleFilterChangeFromAIFilter)
  ------------------------- */
  useEffect(() => {
    if (!isReady) return;

    onFilterChange({
      areaCode: selectedCity ? Number(selectedCity.areaCode) : null,
      sigunguCode: selectedDistrict
        ? Number(selectedDistrict.sigunguCode)
        : null,
    });
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
              setAppliedDefaultDistrict(true);
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
            onClick={() => {
              setSelectedDistrict(null);
              setAppliedDefaultDistrict(true);
            }}
          >
            전체
          </div>

          {districts.map((d) => (
            <div
              key={d.sigunguCode}
              className={`district-tag ${
                selectedDistrict?.sigunguCode === d.sigunguCode ? "active" : ""
              }`}
              onClick={() => {
                setSelectedDistrict(d);
                setAppliedDefaultDistrict(true);
              }}
            >
            {d.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
