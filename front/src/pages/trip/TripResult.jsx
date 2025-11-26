import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MapWithPlan from "../../components/trip/MapWithPlan";

function TripResult() {
  const location = useLocation();
  const aiPlan = location.state?.aiPlan;

  const [highlight, setHighlight] = useState({ day: null, index: null });
  const [selectedPlace, setSelectedPlace] = useState(null);

  // 일정표 클릭 시 자동 스크롤
  useEffect(() => {
    if (highlight.day === null) return;
    const el = document.getElementById(`place-${highlight.day}-${highlight.index}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  if (!aiPlan) {
    return <div>일정 데이터가 없습니다. 다시 시도해주세요.</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>AI 여행 일정 결과</h2>

      <div style={{ display: "flex", marginTop: "20px", gap: "20px" }}>
        
        {/* 지도 */}
        <div style={{ flex: 2 }}>
          <MapWithPlan
            aiPlan={aiPlan.days}
            onSelectPlace={(dayIdx, placeIdx) => {
              setHighlight({ day: dayIdx, index: placeIdx });
              setSelectedPlace(aiPlan.days[dayIdx].places[placeIdx]);
            }}
          />
        </div>

        {/* 오른쪽 일정표 + 상세정보 */}
        <div
          style={{
            flex: 1,
            border: "1px solid #ddd",
            padding: "12px",
            borderRadius: "8px",
            maxHeight: "500px",
            overflowY: "auto",
          }}
        >
          {/* 상세 카드 */}
          {selectedPlace && (
            <div style={{ marginBottom: "18px", borderBottom: "1px solid #ccc", paddingBottom: "12px" }}>
              {selectedPlace.image && (
                <img
                  src={selectedPlace.image}
                  alt={selectedPlace.name}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                />
              )}
              <h2 style={{ marginBottom: "6px" }}>{selectedPlace.name}</h2>
              {selectedPlace.address && <p>📍 {selectedPlace.address}</p>}
              {selectedPlace.time && <p>🕒 방문 예정: {selectedPlace.time}</p>}
              {selectedPlace.memo && <p>📝 메모: {selectedPlace.memo}</p>}

              <div style={{ marginTop: "8px", display: "flex", gap: "8px" }}>
                <a
                  href={`https://map.naver.com/v5/search/${selectedPlace.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "6px 10px",
                    background: "#03C75A",
                    color: "white",
                    borderRadius: "6px",
                  }}
                >
                  네이버 지도
                </a>
              </div>
            </div>
          )}

          {/* 일정표 */}
          <h3>{aiPlan.title}</h3>
          {aiPlan.days.map((day, dayIdx) => (
            <div key={dayIdx} style={{ marginBottom: "16px" }}>
              <h4>{day.day}일차</h4>
              <ul style={{ paddingLeft: "18px" }}>
                {day.places.map((p, placeIdx) => (
                  <li
                    key={placeIdx}
                    id={`place-${dayIdx}-${placeIdx}`}
                    onClick={() => {
                      setHighlight({ day: dayIdx, index: placeIdx });
                      setSelectedPlace(p);
                    }}
                    style={{
                      marginBottom: "4px",
                      padding: "4px 6px",
                      borderRadius: "6px",
                      background:
                        highlight.day === dayIdx && highlight.index === placeIdx
                          ? "yellow"
                          : "transparent",
                      fontWeight:
                        highlight.day === dayIdx && highlight.index === placeIdx
                          ? "700"
                          : "normal",
                      cursor: "pointer",
                    }}
                  >
                    ⏱ {p.time} — 📍 {p.name} {p.address && ` (${p.address})`}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TripResult;
