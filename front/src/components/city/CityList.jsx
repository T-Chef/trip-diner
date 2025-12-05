import React, { useState, useEffect } from "react";
import CityListItem from "./CityListItem";
import axios from "axios";
import "../../styles/page/city/CityList.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function CityList({ filter }) {
  const { areaCode, sigunguCode, keyword } = filter;  

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  // ⭐ 필터가 변경될 때만 관광지 호출
  useEffect(() => {
    if (!areaCode) {
      setPlaces([]);
      return;
    }

    async function fetchPlaces() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/place/places`, {
        params: { 
          areaCode, 
          sigunguCode, 
          keyword: keyword || ""
        }
      });

        setPlaces(res.data.slice(0, 10));
      } catch (e) {
        console.error("관광지 데이터 불러오기 실패", e);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, [areaCode, sigunguCode, keyword]);

  if (loading) return <div>불러오는 중...</div>;

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
