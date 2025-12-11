// src/components/city/CityList.jsx
import React, { useState, useEffect } from "react";
import CityListItem from "./CityListItem";
import axios from "axios";
import "../../styles/page/city/CityList.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function CityList({ filter }) {
  const { areaCode, sigunguCode, keyword } = filter;
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!areaCode) {
      setPlaces([]);
      return;
    }

    const fetchPlaces = async () => {
      try {
        setLoading(true);

        const res = await axios.get(`${API_BASE}/place/places`, {
          params: { areaCode, sigunguCode, keyword: keyword ?? "" },
        });

        const data = res.data || [];

        // TOP 10만 사용
        setPlaces(data.slice(0, 10));
      } catch (err) {
        console.error("🔥 관광지 목록 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [areaCode, sigunguCode, keyword]);

  if (loading) return <div className="loading">불러오는 중...</div>;
  
  if (places.length === 0) {
    return (
      <div className="no-result">
        이 지역에 아직 보여줄 여행지가 없어요.  
        다른 도시를 선택해볼까요?
      </div>
    );
  }

  return (
    <div className="city-list-grid">
      <div className="city-list-left">
        {places.slice(0, 5).map((p, idx) => (
          <CityListItem key={p.contentId} index={idx + 1} item={p} />
        ))}
      </div>

      <div className="city-list-right">
        {places.slice(5, 10).map((p, idx) => (
          <CityListItem key={p.contentId} index={idx + 6} item={p} />
        ))}
      </div>
    </div>
  );
}
