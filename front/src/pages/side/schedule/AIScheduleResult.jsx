import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AIScheduleMap from "./AIScheduleMap.jsx";
import "../../../styles/side/schedule/AIScheduleResult.css";

export default function AIScheduleResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const aiPlan = location.state?.aiPlan;

  const [highlight, setHighlight] = useState({ day: null, index: null });
  const [selectedPlace, setSelectedPlace] = useState(null);

  // 일정 클릭 시 자동 스크롤
  useEffect(() => {
    if (highlight.day === null) return;
    const el = document.getElementById(
      `place-${highlight.day}-${highlight.index}`
    );
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  if (!aiPlan) {
    return <div>⚠️ 일정 데이터가 없습니다. 다시 시도해주세요.</div>;
  }

  return (
    <div className="result-wrapper">
      {/* 상단 타이틀 */}
      <h2 className="result-title">✨ AI 여행 계획이 완성되었습니다!</h2>

      {/* 메인 레이아웃 */}
      <div className="result-layout">
        {/* 왼쪽 Day 리스트 */}
        <aside className="side-list">
          <h3 className="plan-title">{aiPlan.title || "여행 일정"}</h3>

          {aiPlan.days.map((day, dayIdx) => (
            <div key={dayIdx} className="day-block">
              <h4 className="day-header">{day.day}일차</h4>

              {day.places.map((p, placeIdx) => (
                <div
                  key={placeIdx}
                  id={`place-${dayIdx}-${placeIdx}`}
                  className={`place-item ${
                    highlight.day === dayIdx && highlight.index === placeIdx
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setHighlight({ day: dayIdx, index: placeIdx });
                    setSelectedPlace(p);
                  }}
                >
                  ⏱ {p.time} — 📍 {p.name}
                </div>
              ))}
            </div>
          ))}

          {/* 버튼들 */}
          <div className="action-buttons">
            <button className="btn-primary">저장하기 💾</button>
            <button className="btn-accent">공유하기 📤</button>
            <button className="btn-dark" onClick={() => navigate("/trip")}>
              다시 계획하기 🔄
            </button>
          </div>
        </aside>

        {/* 지도 */}
        <div className="map-area">
          <AIScheduleMap
            aiPlan={aiPlan.days}
            onSelectPlace={(dayIdx, placeIdx) => {
              setHighlight({ day: dayIdx, index: placeIdx });
              setSelectedPlace(aiPlan.days[dayIdx].places[placeIdx]);
            }}
          />
        </div>

        {/* 오른쪽 슬라이드 패널 */}
        <div className={`slide-panel ${selectedPlace ? "open" : ""}`}>
          {selectedPlace && (
            <>
              <button
                className="close-btn"
                onClick={() => setSelectedPlace(null)}
              >
                ✕
              </button>

              {selectedPlace.image && (
                <img
                  className="detail-image"
                  src={selectedPlace.image}
                  alt={selectedPlace.name}
                />
              )}

              <h3 className="place-title">{selectedPlace.name}</h3>

              {selectedPlace.address && (
                <p className="place-info">📍 {selectedPlace.address}</p>
              )}
              {selectedPlace.time && (
                <p className="place-info">⏱ {selectedPlace.time}</p>
              )}
              {selectedPlace.memo && (
                <p className="place-info">📝 {selectedPlace.memo}</p>
              )}

              <a
                href={`https://map.naver.com/v5/search/${selectedPlace.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="map-button"
              >
                네이버지도 바로가기
              </a>
            </>
          )}
        </div>
      </div>

      {/* 오버레이 */}
      {selectedPlace && (
        <div className="overlay" onClick={() => setSelectedPlace(null)} />
      )}
    </div>
  );
}
