import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import AIScheduleMap from "./AIScheduleMap.jsx";

export default function ScheduleResult() {
  const location = useLocation();
  const aiPlan = location.state?.aiPlan;

  const [highlight, setHighlight] = useState({ day: null, index: null });
  const [selectedPlace, setSelectedPlace] = useState(null);

  // 일정 항목 클릭 → 자동 스크롤
  useEffect(() => {
    if (highlight.day === null) return;
    const el = document.getElementById(
      `place-${highlight.day}-${highlight.index}`
    );
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  if (!aiPlan) {
    return (
      <div style={{ padding: "20px" }}>
        일정 데이터를 불러올 수 없습니다. 다시 시도해주세요.
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>AI 여행 일정 결과</h2>

      <div style={{ display: "flex", marginTop: "20px", gap: "20px" }}>
        {/* 왼쪽 지도 영역 */}
        <div style={{ flex: 2 }}>
          <AIScheduleMap
            aiPlan={aiPlan.days}
            onSelectPlace={(dayIdx, placeIdx) => {
              setHighlight({ day: dayIdx, index: placeIdx });
              setSelectedPlace(aiPlan.days[dayIdx].places[placeIdx]);
            }}
          />
        </div>

        {/* 오른쪽 일정표 & 상세 정보 */}
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
          {/* 선택한 장소 상세 카드 */}
          {selectedPlace && (
            <div
              style={{
                marginBottom: "18px",
                borderBottom: "1px solid #ccc",
                paddingBottom: "12px",
              }}
            >
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

              <div style={{ marginTop: "8px" }}>
                <a
                  href={`https://map.naver.com/v5/search/${selectedPlace.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "6px 10px",
                    background: "#03C75A",
                    color: "white",
                    borderRadius: "6px",
                    display: "inline-block",
                    marginTop: "5px",
                  }}
                >
                  네이버 지도 열기
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
                          ? "#fff4b8"
                          : "transparent",
                      fontWeight:
                        highlight.day === dayIdx && highlight.index === placeIdx
                          ? "700"
                          : "normal",
                      cursor: "pointer",
                    }}
                  >
                    ⏱ {p.time} — 📍 {p.name}
                    {p.address && ` (${p.address})`}
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
