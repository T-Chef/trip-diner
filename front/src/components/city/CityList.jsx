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
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!areaCode) {
      setPlaces([]);
      setErrorMsg(null);
      return;
    }

    const fetchPlaces = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await axios.get(`${API_BASE}/place/places`, {
          params: { areaCode, sigunguCode, keyword: keyword ?? "" },
        });

        // ✅ 백엔드가 배열 또는 {data:배열} 둘 다 대비
      const raw = res.data;
      let list = [];

      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.data)) {
        list = raw.data;
        if (raw.message) {
          // (지금은 안 쓰지만 혹시 모를 경우 대비)
          setErrorMsg(raw.message);
        }
      } else {
        // 완전히 예상 밖 형태면 에러로 간주
        setErrorMsg("여행지 데이터를 해석하지 못했어요.");
      }

      setPlaces(list.slice(0, 10));
    } catch (err) {
      console.error("🔥 관광지 목록 로드 실패:", err);

      // ✅ 새로운 데이터는 못 받았지만, 이전 목록은 그대로 둔다
      setErrorMsg(
        "지금 여행지 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      );
      // setPlaces([]);  ← 이건 지운다
    } finally {
      setLoading(false);
    }
  };

    fetchPlaces();
  }, [areaCode, sigunguCode, keyword]);

  // 🔹 지역이 아직 선택 안 됐을 때
  if (!areaCode) {
    return (
      <div className="city-list-empty">
        지역을 선택하면 인기 많은 여행지를 보여드릴게요.
      </div>
    );
  }

  // 🔹 로딩 중일 때 스켈레톤 UI
  if (loading) {
     return (
    <div className="city-list-grid">
      <div className="city-list-left">
        {Array.from({ length: 5 }).map((_, idx) => (
          <CityListItem
            key={`sk-left-${idx}`}
            index={idx + 1}
            isSkeleton
          />
        ))}
      </div>

      <div className="city-list-right">
        {Array.from({ length: 5 }).map((_, idx) => (
          <CityListItem
            key={`sk-right-${idx}`}
            index={idx + 6}
            isSkeleton
          />
        ))}
      </div>
    </div>
  );
}

  // 🔹 보여줄 여행지가 없을 때
  if (!places.length) {
    return (
      <div className="city-list-empty">
        {errorMsg ? (
        <>
          {errorMsg}
          <br />
          다른 지역이나 키워드로 다시 시도해 주세요.
        </>
      ) : (
        <>
          이 지역에 아직 보여줄 여행지가 없어요.
          <br />
          다른 도시나 키워드로 검색해볼까요?
        </>
      )}
      </div>
    );
  }

  // 🔹 정상적으로 여행지 목록 보여주기
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
