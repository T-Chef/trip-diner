import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AIScheduleMap from "./AIScheduleMap.jsx";
import "../../../styles/side/schedule/AIScheduleResult.css";

console.log("🎯 GOOGLE KEY:", process.env.REACT_APP_GOOGLE_API_KEY);

// ✅ 카테고리 영문 → 한글 라벨 매핑
const CATEGORY_LABELS = {
  restaurant: "음식점",
  food: "음식점",
  cafe: "카페",
  bakery: "베이커리",
  bar: "바 / 주점",
  lodging: "숙소",
  amusement_park: "놀이공원",
  tourist_attraction: "관광명소",
  point_of_interest: "관광명소",
  park: "공원",
  museum: "박물관",
  art_gallery: "미술관",
  shopping_mall: "쇼핑몰",
  store: "상점 / 마켓",
};

// ✅ 카테고리 배열/문자열 → 한글 라벨로 변환
function getCategoryLabel(category) {
  const raw = Array.isArray(category) ? category[0] : category;
  if (!raw) return "";

  const normalized = String(raw).toLowerCase().replace(/\s+/g, "_"); // "tourist attraction" → "tourist_attraction"
  const mapped = CATEGORY_LABELS[normalized];

  // 매핑 있으면 한글, 없으면 그냥 예쁘게만 보여주기
  return mapped || String(raw).replace(/_/g, " ");
}

// ✅ 거리 계산용 (하루 동선 km)
function distanceKm(lat1, lng1, lat2, lng2) {
  if (
    lat1 == null ||
    lng1 == null ||
    lat2 == null ||
    lng2 == null
  )
    return 0;

  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AIScheduleResult() {
  const location = useLocation();
  const navigate = useNavigate();

  // 라우터에서 넘어온 원본 플랜
  const rawPlan = location.state?.aiPlan;
  const themes = rawPlan?.themes || location.state?.themes || [];

  // 화면에서 사용할 플랜(사진/주소 붙여서 사용)
  const [aiPlan, setAiPlan] = useState(rawPlan);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // rawPlan이 바뀔 때마다 aiPlan 초기화
  useEffect(() => {
    setAiPlan(rawPlan);
  }, [rawPlan]);

  console.log("📌 AI PLAN RESULT (state):", aiPlan);

  const [highlight, setHighlight] = useState({ day: null, index: null });
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [searchTarget, setSearchTarget] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recommending, setRecommending] = useState(false);

  // 🔹 요약 카드용 통계
  const [summary, setSummary] = useState({
    totalPlaces: 0,
    totalDistanceKm: 0,
  });

  // ✅ 1) 일정편집 / 편집완료 토글
  const handleToggleEdit = () => {
    setEditMode((prev) => !prev);
  };

  // ✅ 2) 확인 버튼 → 요약 페이지로
  const handleConfirm = () => {
    if (!aiPlan) return;

    navigate("/trip/summary", {
      state: {
        aiPlan,
        themes,
      },
    });
  };

  // ✅ 3) 새로운 추천받기
  const handleNewRecommend = async () => {
    try {
      if (!aiPlan) return;

      setRecommending(true); // 로딩 시작

      const daysCount = aiPlan.daysCount || aiPlan.days?.length || 1;

      const body = {
        cityName: aiPlan.cityName,
        days: daysCount,
        peopleType: aiPlan.peopleType,
        themes: aiPlan.themes || themes,
      };

      const res = await fetch("http://localhost:4000/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("새로운 추천 API 에러:", res.status);
        alert("새로운 추천을 받는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const data = await res.json();
      if (!data.aiPlan) {
        alert("새로운 추천 결과가 비어 있습니다.");
        return;
      }

      // 같은 결과 페이지로, 새로운 aiPlan을 들고 다시 이동
      navigate("/trip/result", {
        state: {
          aiPlan: data.aiPlan,
          themes: data.aiPlan.themes || body.themes,
        },
      });
    } catch (err) {
      console.error("새로운 추천받기 오류:", err);
      alert("새로운 추천을 받는 중 오류가 발생했습니다.");
    } finally {
      setRecommending(false);
    }
  };

  // ✅ 4) 다시 선택하기 버튼
  const handleReSelect = () => {
    navigate("/trip"); // 컨셉/도시 선택 페이지 경로
  };

  // ✅ 이미지/주소/카테고리 보강용 useEffect
  useEffect(() => {
    if (!rawPlan || !rawPlan.days) return;

    const enhanceAllPlaces = async () => {
      try {
        setIsEnhancing(true);

        // 깊은 복사 (days / places 배열 새로 만들기)
        const updated = {
          ...rawPlan,
          days: (rawPlan.days || []).map((day) => ({
            ...day,
            places: [...(day.places || [])],
          })),
        };

        for (let d = 0; d < updated.days.length; d++) {
          for (let i = 0; i < updated.days[d].places.length; i++) {
            const p = updated.days[d].places[i];
            if (!p.lat || !p.lng) continue;

            try {
              const imgRes = await fetch(
                `http://localhost:4000/api/place-details?lat=${p.lat}&lng=${p.lng}&name=${encodeURIComponent(
                  p.name
                )}`
              );
              const data = await imgRes.json();
              p.image = data.image ?? p.image;
              p.address = data.address ?? p.address;
              p.category = data.category ?? p.category;
            } catch (e) {
              console.error("place-details 오류:", e);
            }
          }
        }

        console.log("📌 이미지/주소 보강 완료!");
        setAiPlan(updated); // ✅ 여기서만 상태 갱신
      } finally {
        setIsEnhancing(false);
      }
    };

    enhanceAllPlaces();
  }, [rawPlan]);

  // ✅ 여행 요약 계산 (총 이동거리, 장소 개수)
  useEffect(() => {
    if (!aiPlan || !aiPlan.days) return;

    let totalPlaces = 0;
    let totalDistance = 0;

    aiPlan.days.forEach((day) => {
      const places = day.places || [];
      totalPlaces += places.length;

      for (let i = 1; i < places.length; i++) {
        const prev = places[i - 1];
        const cur = places[i];
        totalDistance += distanceKm(
          Number(prev.lat),
          Number(prev.lng),
          Number(cur.lat),
          Number(cur.lng)
        );
      }
    });

    setSummary({
      totalPlaces,
      totalDistanceKm: Math.round(totalDistance),
    });
  }, [aiPlan]);

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

      navigate("/trip/result", { state: { aiPlan: updated, themes } });

      setSearchTarget(null);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error("장소 추가 중 오류:", err);
    }
  };

  useEffect(() => {
    if (!highlight || highlight.day === null) return;
    const el = document.getElementById(
      `place-${highlight.day}-${highlight.index}`
    );
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlight]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      const res = await fetch(
        `http://localhost:4000/api/place-search?keyword=${encodeURIComponent(
          searchQuery
        )}`
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

          {/* ✅ 여행 요약 카드 */}
          <div className="trip-summary-card">
            <div className="summary-header">
              {(() => {
                const totalDays = aiPlan.daysCount || aiPlan.days?.length || 1;
                const nights = Math.max(totalDays - 1, 0);
                return (
                  <>
                    <span className="summary-days">
                      {nights}박 {totalDays}일
                    </span>
                    {aiPlan.peopleType && (
                      <span className="summary-people">
                        {aiPlan.peopleType} 여행
                      </span>
                    )}
                  </>
                );
              })()}
            </div>

            <ul className="summary-stats">
              <li>
                <span className="label">총 이동거리</span>
                <strong>
                  {summary.totalDistanceKm > 0
                    ? `${summary.totalDistanceKm}km`
                    : "계산 중"}
                </strong>
              </li>
              <li>
                <span className="label">여행지역</span>
                <strong>
                  {aiPlan.cityName
                    ? `${aiPlan.cityName} ~ ${aiPlan.cityName}`
                    : aiPlan.title}
                </strong>
              </li>
              <li>
                <span className="label">추천 장소</span>
                <strong>{summary.totalPlaces}곳</strong>
              </li>
            </ul>

            {themes.length > 0 && (
              <div className="summary-tags">
                {themes.map((t) => (
                  <span key={t} className="summary-tag">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {aiPlan.days.map((day, dayIdx) => (
            <div key={dayIdx} className="day-block">
              <h4 className="day-header">{day.day}일차</h4>

              {day.places.map((p, placeIdx) => (
                <div
                  key={placeIdx}
                  id={`place-${dayIdx}-${placeIdx}`}
                  className={`place-item ${
                    highlight.day === dayIdx &&
                    highlight.index === placeIdx
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    if (editMode) return;
                    setHighlight({ day: dayIdx, index: placeIdx });
                    setSelectedPlace(p);
                  }}
                >
                  <img
                    src={
                      p.image ?? "/assets/images/default-placeholder.jpg"
                    }
                    onError={(e) =>
                      (e.target.src =
                        "/assets/images/default-placeholder.jpg")
                    }
                    alt="thumb"
                    className="list-thumb"
                  />
                  <div className="place-text">
                    {p.time && <span>⏱ {p.time}</span>}
                    📍 {p.name}
                    {p.category?.[0] && (
                      <span className="place-tag">
                        {getCategoryLabel(p.category)}
                      </span>
                    )}
                  </div>
                  {editMode && (
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = { ...aiPlan };
                        updated.days[dayIdx].places.splice(placeIdx, 1);
                        navigate("/trip/result", {
                          state: { aiPlan: updated, themes },
                        });
                      }}
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}

              {editMode && (
                <button
                  className="btn-add"
                  onClick={() => setSearchTarget({ dayIdx })}
                >
                  ➕ 장소 추가
                </button>
              )}
            </div>
          ))}

          <div className="action-buttons">
            {/* 일정편집 / 편집완료 */}
            <button className="btn-dark" onClick={handleToggleEdit}>
              {editMode ? "편집완료 📁" : "일정편집 ✏️"}
            </button>

            {/* 확인 */}
            <button className="btn-primary" onClick={handleConfirm}>
              확인
            </button>

            {/* 새로운 추천받기 */}
            <button
              className="btn-accent"
              onClick={handleNewRecommend}
              disabled={recommending}
            >
              {recommending ? "새로운 추천 만드는 중..." : "새로운 추천받기 🎲"}
            </button>

            {/* 다시 선택하기 */}
            <button className="btn-dark" onClick={handleReSelect}>
              다시 선택하기 🔄
            </button>
          </div>
        </aside>

        <div className="map-area">
          {/* ✅ 일차별 색상 레전드 */}
          <div className="day-legend">
            {aiPlan.days.map((day, idx) => (
              <div key={day.day} className="legend-item">
                <span className={`legend-dot legend-dot-${idx}`} />
                <span className={`legend-line legend-line-${idx}`} />
                <span className="legend-label">{day.day}일차</span>
              </div>
            ))}
          </div>

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
              <button
                className="close-btn"
                onClick={() => setSelectedPlace(null)}
              >
                ✕
              </button>
              <img
                className="detail-image"
                src={
                  selectedPlace.image ??
                  "/assets/images/default-placeholder.jpg"
                }
                onError={(e) =>
                  (e.target.src = "/assets/images/default-placeholder.jpg")
                }
                alt={selectedPlace.name}
              />
              <h3 className="place-title">{selectedPlace.name}</h3>

              {selectedPlace.category?.[0] && (
                <p className="place-category">
                  {getCategoryLabel(selectedPlace.category)}
                </p>
              )}

              {selectedPlace.description &&
                selectedPlace.description.trim().length > 0 && (
                  <p className="place-summary">
                    {selectedPlace.description}
                  </p>
                )}

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
                  "point_of_interest",
                ];

                const category = selectedPlace.category?.[0];
                const shouldShowOpenNow =
                  selectedPlace.openNow !== null &&
                  selectedPlace.openNow !== undefined &&
                  category &&
                  !hideOpenNowCategories.includes(category);

                return shouldShowOpenNow ? (
                  <p className="place-status">
                    {selectedPlace.openNow
                      ? "영업중 🔥"
                      : "준비중/운영시간 확인 필요 ⚠️"}
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
            <button
              className="close-search"
              onClick={() => setSearchTarget(null)}
            >
              ✕
            </button>

            <ul className="search-list">
              {searchResults.map((place) => (
                <li
                  key={place.placeId}
                  className="search-item"
                  onClick={() => handleAddPlace(place)}
                >
                  <img
                    src={
                      place.image ||
                      "/assets/images/default-placeholder.jpg"
                    }
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
                      <span
                        className={`open-status ${
                          place.openNow ? "open" : "closed"
                        }`}
                      >
                        {place.openNow ? "영업중 🔥" : "영업종료 ❌"}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
