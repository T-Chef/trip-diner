import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AIScheduleMap from "./AIScheduleMap.jsx";
import "../../../styles/side/schedule/AIScheduleResult.css";

console.log("🎯 GOOGLE KEY:", process.env.REACT_APP_GOOGLE_API_KEY);

export default function AIScheduleResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const aiPlan = location.state?.aiPlan;
  console.log("📌 AI PLAN RESULT FIXED:", aiPlan);

  const [highlight, setHighlight] = useState({ day: null, index: null });
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [searchTarget, setSearchTarget] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const enhanceAllPlaces = async () => {
      const updated = { ...aiPlan };
      for (let d = 0; d < updated.days.length; d++) {
        for (let i = 0; i < updated.days[d].places.length; i++) {
          const p = updated.days[d].places[i];
          if (!p.lat || !p.lng) continue;
          const imgRes = await fetch(
            `http://localhost:4000/api/place-details?lat=${p.lat}&lng=${p.lng}&name=${encodeURIComponent(p.name)}`
          );
          const data = await imgRes.json();
          p.image = data.image ?? p.image;
          p.address = data.address ?? p.address;
          p.category = data.category ?? p.category;
        }
      }
      console.log("📌 이미지/주소 보강 완료!");
      navigate("/trip/result", { state: { aiPlan: updated } });
    };
    if (aiPlan) enhanceAllPlaces();
  }, []);

  const handleAddPlace = async (place) => {
  try {
    const { lat, lng } = place;

    const updated = { ...aiPlan };
    updated.days[searchTarget.dayIdx].places.push({
      name: place.name,
      address: place.address,
      lat,
      lng,
      image: place.image || "/assets/images/default-placeholder.jpg",
      category: [place.types?.[0]?.replace(/_/g, " ")],
      rating: place.rating,
      reviews: place.reviews,
      openNow: place.openNow,
      placeId: place.placeId,
      startTime: null,
      endTime: null,
    });

    navigate("/trip/result", { state: { aiPlan: updated } });

    setSearchTarget(null);
    setSearchQuery("");
    setSearchResults([]);
  } catch (err) {
    console.error("장소 추가 중 오류:", err);
  }
};

  useEffect(() => {
    if (!highlight || highlight.day === null) return;
    const el = document.getElementById(`place-${highlight.day}-${highlight.index}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      const res = await fetch(
  `http://localhost:4000/api/place-search?keyword=${encodeURIComponent(searchQuery)}`
);
const data = await res.json();
setSearchResults(data.results || []);

    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  if (!aiPlan) {
    return <div>⚠️ 일정 데이터가 없습니다. 다시 시도해주세요.</div>;
  }

  return (
    <div className="result-wrapper">
      <h2 className="result-title">✨ AI 여행 계획이 완성되었습니다!</h2>

      <div className="result-layout">
        <aside className="side-list">
          <h3 className="plan-title">{aiPlan.title}</h3>

          {aiPlan.days.map((day, dayIdx) => (
            <div key={dayIdx} className="day-block">
              <h4 className="day-header">{day.day}일차</h4>

              {day.places.map((p, placeIdx) => (
                <div
                  key={placeIdx}
                  id={`place-${dayIdx}-${placeIdx}`}
                  className={`place-item ${
                    highlight.day === dayIdx && highlight.index === placeIdx ? "active" : ""
                  }`}
                  onClick={() => {
                    if (editMode) return;
                    setHighlight({ day: dayIdx, index: placeIdx });
                    setSelectedPlace(p);
                  }}
                >
                  <img
                    src={p.image ?? "/assets/images/default-placeholder.jpg"}
                    onError={(e) => (e.target.src = "/assets/images/default-placeholder.jpg")}
                    alt="thumb"
                    className="list-thumb"
                  />
                  <div className="place-text">
                    {p.time && (
                    <span>⏱ {p.time}</span>
                    )}
                    📍 {p.name}

                    {p.category?.[0] && (
                      <span className="place-tag">{p.category[0]}</span>
                    )}
                  </div>
                  {editMode && (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = { ...aiPlan };
                        updated.days[dayIdx].places.splice(placeIdx, 1);
                        navigate("/trip/result", { state: { aiPlan: updated } });
                      }}
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}

              {editMode && (
                <button className="btn-add" onClick={() => setSearchTarget({ dayIdx })}>
                  ➕ 장소 추가
                </button>
              )}
            </div>
          ))}

          <div className="action-buttons">
            <button className="btn-dark" onClick={() => setEditMode(!editMode)}>
              {editMode ? "편집완료 📁" : "일정편집 ✏️"}
            </button>
            <button className="btn-primary">저장하기 💾</button>
            <button className="btn-accent">공유하기 📤</button>
            <button className="btn-dark" onClick={() => navigate("/trip")}>
              다시 계획하기 🔄
            </button>
          </div>
        </aside>

        <div className="map-area">
          <AIScheduleMap
            aiPlan={aiPlan}
            activePlace={highlight}
            onSelectPlace={(dayIdx, placeIdx) => {
              setHighlight({ day: dayIdx, index: placeIdx });
              setSelectedPlace(aiPlan.days[dayIdx].places[placeIdx]);
            }}
          />
        </div>

        <div className={`slide-panel ${selectedPlace ? "open" : ""}`}>
          {selectedPlace && (
            <>
              <button className="close-btn" onClick={() => setSelectedPlace(null)}>✕</button>
              <img
                className="detail-image"
                src={selectedPlace.image ?? "/assets/images/default-placeholder.jpg"}
                onError={(e) => (e.target.src = "/assets/images/default-placeholder.jpg")}
                alt={selectedPlace.name}
              />
              <h3 className="place-title">{selectedPlace.name}</h3>
              <p className="place-info">{selectedPlace.address}</p>
              {selectedPlace.rating && (
  <p className="place-rating">
    ⭐ {selectedPlace.rating} ({selectedPlace.reviews})
  </p>
)}

{(() => {
  const hideOpenNowCategories = [
    "tourist_attraction",
    "natural_feature",
    "park",
    "point_of_interest"
  ];

  const category = selectedPlace.category?.[0];
  const shouldShowOpenNow =
    selectedPlace.openNow !== null &&
    selectedPlace.openNow !== undefined &&
    category &&
    !hideOpenNowCategories.includes(category);

  return shouldShowOpenNow ? (
    <p className="place-status">
      {selectedPlace.openNow ? "영업중 🔥" : "준비중/운영시간 확인 필요 ⚠️"}
    </p>
  ) : null;
})()}

            </>
          )}
        </div>

        {searchTarget && (
          <div className="search-panel">
            <input
              className="search-input"
              placeholder="장소 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="close-search" onClick={() => setSearchTarget(null)}>✕</button>

            <ul className="search-list">
             {searchResults.map((place) => (
  <li
    key={place.placeId}
    className="search-item"
    onClick={() => handleAddPlace(place)}
  >
    <img
      src={place.image || "/assets/images/default-placeholder.jpg"}

      alt="thumb"
      className="search-thumb"
    />

    <div className="search-info">
      <div className="search-title">{place.name}</div>

      {place.rating && (
        <div className="rating">
          ⭐ {place.rating} ({place.reviews})
        </div>
      )}

      {place.types && (
        <span className="search-tag">
          {place.types[0].replace(/_/g, " ")}
        </span>
      )}

      <div className="search-address">{place.address}</div>

      {place.openNow !== null && (
        <span className={`open-status ${place.openNow ? "open" : "closed"}`}>
          {place.openNow ? "영업중 🔥" : "영업종료 ❌"}
        </span>
      )}
    </div>
  </li>
))}
            </ul>
          </div>
        )}

        {/* result-layout 끝 */}
      </div>
      {/* result-wrapper 끝 */}
    </div>
  );
}
