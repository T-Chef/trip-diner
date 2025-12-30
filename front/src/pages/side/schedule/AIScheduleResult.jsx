import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AIScheduleMap from "./AIScheduleMap.jsx";
import "../../../styles/side/schedule/AIScheduleResult.css";
import axios from "axios";

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
  const [, setIsEnhancing] = useState(false);
  

  // rawPlan이 바뀔 때마다 aiPlan 초기화
  useEffect(() => {
    setAiPlan(rawPlan);
  }, [rawPlan]);

  console.log("📌 AI PLAN RESULT (state):", aiPlan);

  const [highlight, setHighlight] = useState({ day: null, index: null });
  const [selectedPlace, setSelectedPlace] = useState(null);
    const API_BASE = "http://localhost:4000/api";

  // ✅ selectedPlace의 (dayIdx, placeIdx)도 같이 기억해야 "aiPlan 안에" description을 저장할 수 있음
  const [selectedPos, setSelectedPos] = useState(null);
  const [descLoading, setDescLoading] = useState(false);

  // ✅ place.description이 없을 때만 호출
  const fetchDesc = async (place) => {
    const resp = await axios.get(`${API_BASE}/ai/description`, {
      params: { name: place.name, address: place.address },
    });
    return resp.data.description;
  };

  // ✅ aiPlan 내부 특정 place를 안전하게 업데이트하는 유틸
  const patchPlaceInPlan = (dayIdx, placeIdx, patch) => {
    setAiPlan((prev) => {
      if (!prev?.days?.[dayIdx]?.places?.[placeIdx]) return prev;

      const next = {
        ...prev,
        days: prev.days.map((d, di) =>
          di !== dayIdx
            ? d
            : {
                ...d,
                places: d.places.map((p, pi) =>
                  pi !== placeIdx ? p : { ...p, ...patch }
                ),
              }
        ),
      };
      return next;
    });
  };

  // ✅ 슬라이드 패널(선택된 장소)이 열릴 때 description 없으면 자동으로 가져오기
  useEffect(() => {
    if (!selectedPos || !aiPlan?.days) return;

    const { dayIdx, placeIdx } = selectedPos;
    const p = aiPlan.days?.[dayIdx]?.places?.[placeIdx];
    if (!p || p.description) return; // 이미 있으면 호출 X
    if (!p.name) return;

    let cancelled = false;

    (async () => {
      try {
        setDescLoading(true);
        const desc = await fetchDesc(p);
        if (cancelled) return;

        // ✅ aiPlan 내부에도 저장 (다음에 다시 눌러도 재호출 안 함)
        patchPlaceInPlan(dayIdx, placeIdx, { description: desc });

        // ✅ 현재 열려있는 selectedPlace에도 반영
        setSelectedPlace((prev) => (prev ? { ...prev, description: desc } : prev));
      } catch (e) {
        console.error("description 불러오기 실패:", e);
      } finally {
        if (!cancelled) setDescLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPos, aiPlan]);


  const [editMode, setEditMode] = useState(false);
  const [searchTarget, setSearchTarget] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [recommending, setRecommending] = useState(false);
  const recommendLockRef = useRef(false); 
  const [cooldownMs, setCooldownMs] = useState(0);
  const [panelTab, setPanelTab] = useState("search"); 
  const [likedPlaces, setLikedPlaces] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);

  useEffect(() => {
  if (cooldownMs <= 0) return;
  const t = setInterval(() => {
    setCooldownMs((ms) => Math.max(0, ms - 1000));
  }, 1000);
  return () => clearInterval(t);
}, [cooldownMs]);

// 🔹 요약 카드용 통계
const [summary, setSummary] = useState({
  totalPlaces: 0,
  totalDistanceKm: 0,
});

  const openLikesTab = () => {
    setPanelTab("likes");
    setSearchQuery("");
    setSearchResults([]);
  };

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
  if (!aiPlan) return;

  // ✅ 이미 생성중/쿨다운이면 무시
  if (cooldownMs > 0) return;
  if (recommendLockRef.current) return;

  // ✅ 클릭 즉시 락
  recommendLockRef.current = true;
  setRecommending(true);

  try {
    const daysCount = aiPlan.daysCount || aiPlan.days?.length || 1;

    const body = {
      cityName: aiPlan.cityName,
      days: daysCount,
      peopleType: aiPlan.peopleType,
      themes: aiPlan.themes || themes,
      forceNew: true,
    };

    const res = await fetch(`${API_BASE}/ai/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // ✅ 서버가 "생성중"이라 409 주면 사용자에게만 알려주고 종료
    if (res.status === 409) {
      const msg = (await res.json().catch(() => null))?.message;
      alert(msg || "이미 계획 생성 중입니다. 완료 후 다시 시도해주세요.");
      setCooldownMs(3000);
      return;
    }

    if (!res.ok) {
      alert("새로운 추천을 받는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
      setCooldownMs(3000);
      return;
    }

    const data = await res.json();
    const nextPlan = data?.aiPlan;

    if (!nextPlan) {
      alert("새로운 추천 결과가 비어 있습니다.");
      setCooldownMs(3000);
      return;
    }

    navigate("/trip/result", {
      state: {
        aiPlan: nextPlan,
        themes: nextPlan.themes || body.themes,
      },
    });
  } catch (err) {
    console.error("새로운 추천받기 오류:", err);
    alert("새로운 추천을 받는 중 오류가 발생했습니다.");
    setCooldownMs(3000);
  } finally {
    setRecommending(false);
    recommendLockRef.current = false;

    // ✅ 성공/실패 상관없이 연타 방지 (원하면 0으로)
    setCooldownMs(5000);
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
        setAiPlan(updated); 
        setCooldownMs(5000);
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

    // ✅ 좋아요한 여행지 불러오기 (API는 너희 백엔드에 맞게 경로만 맞추면 됨)
const getUserId = () => {
  // 프로젝트에 맞춰 user 저장 형태가 다를 수 있으니 여러 후보 커버
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      return u?.user_id || u?.id;
    } catch {}
  }
  const direct =
    localStorage.getItem("user_id") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("uid");
  return direct ? Number(direct) : null;
};

const fetchLikedPlaces = async () => {
  try {
    setLikedLoading(true);

    const userId = getUserId();
    if (!userId) {
      console.log("❗ userId 없음: localStorage 확인 필요");
      setLikedPlaces([]);
      return;
    }

    // ✅ LikePlaces.jsx랑 동일한 API
    const res = await axios.get(`${API_BASE}/place/like/${userId}`);
    setLikedPlaces(Array.isArray(res.data) ? res.data : []);
  } catch (e) {
    console.error("좋아요 목록 불러오기 실패:", e);
    setLikedPlaces([]);
  } finally {
    setLikedLoading(false);
  }
};

  // ✅ 좋아요 데이터 → 현재 handleAddPlace가 받는 형태로 변환
  const normalizeLikedToSearchPlace = (item) => {
  const p = item?.place || {};

  return {
    placeId: p.place_id || p.placeId || item.like_id,
    name: p.name,
    address: p.address || "",
    lat: p.lat ?? p.latitude,   // ✅ DB에 있으면 자동 사용
    lng: p.lng ?? p.longitude,
    image: p.image_url || (process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg"),
    types: p.category ? [p.category] : [],  // 있으면 태그로
    rating: p.rating,
    reviews: p.reviews,
    openNow: p.openNow,
  };
};
useEffect(() => {
  if (!searchTarget) return;
  if (panelTab === "likes") fetchLikedPlaces();
}, [panelTab, searchTarget]);

 const handleAddPlace = (place) => {
  try {
    const { lat, lng } = place;

    setAiPlan((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      next.days[searchTarget.dayIdx].places.push({
        name: place.name,
        address: place.address,
        lat,
        lng,
        image: place.image || "/assets/images/default-placeholder.jpg",
        category: place.types?.length ? [String(place.types[0]).replace(/_/g, " ")] : [],
        rating: place.rating,
        reviews: place.reviews,
        openNow: place.openNow,
        placeId: place.placeId ?? null,
        startTime: null,
        endTime: null,
      });
      return next;
    });

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
      {/* ✅ 새로운 추천받기 로딩 오버레이 */}
    {recommending && (
  <div className="loading-overlay">
    <div className="loading-box">
      <div className="loading-icon">🤖</div>
      <h3 className="loading-title">AI 여행 플래너가</h3>
      <h3 className="loading-title">당신만의 여행 코스를 만드는 중...</h3>
      <p className="loading-sub">
        주변 맛집·명소를 분석해서 일정표를 짜고 있어요.
        <br />
        잠시만 기다려 주세요!
      </p>
      <div className="loading-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
)}
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
  setSelectedPos({ dayIdx, placeIdx });   // ✅ 추가
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
{p.category && (
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
  disabled={recommending || recommendLockRef.current || cooldownMs > 0}
>
  {recommending
    ? "새로운 추천 만드는 중..."
    : cooldownMs > 0
      ? `새로운 추천받기 (${Math.ceil(cooldownMs / 1000)}s)`
      : "새로운 추천받기 🎲"}
</button>

            {/* 다시 선택하기 */}
            <button className="btn-dark" onClick={handleReSelect}>
              다시 선택하기 🔄
            </button>
          </div>
        </aside>

        <div className="map-container">
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
  setSelectedPos({ dayIdx, placeIdx });   // ✅ 추가
  setSelectedPlace(aiPlan.days[dayIdx].places[placeIdx]);
}}

          />
        </div>

        <div className={`slide-panel ${selectedPlace ? "open" : ""}`}>
          {selectedPlace && (
            <>
              <button
  className="close-btn"
  onClick={() => {
    setSelectedPlace(null);
    setSelectedPos(null);
  }}
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

              {selectedPlace.category && (
  <p className="place-category">
    {getCategoryLabel(selectedPlace.category)}
  </p>
)}


             {descLoading && (!selectedPlace.description || !selectedPlace.description.trim()) ? (
  <p className="place-summary">설명 불러오는 중...</p>
) : selectedPlace.description && selectedPlace.description.trim().length > 0 ? (
  <p className="place-summary">{selectedPlace.description}</p>
) : null}
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

                const categoryRaw = Array.isArray(selectedPlace.category)
  ? selectedPlace.category[0]
  : selectedPlace.category;

const category = String(categoryRaw || "")
  .toLowerCase()
  .replace(/\s+/g, "_");

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

    {/* ✅ 탭 버튼 */}
    <div className="panel-tabs">
      <button
        className={panelTab === "search" ? "active" : ""}
        onClick={() => setPanelTab("search")}
        type="button"
      >
        검색
      </button>
      <button
        className={panelTab === "likes" ? "active" : ""}
        onClick={openLikesTab}
        type="button"
      >
        좋아요
      </button>

      <button
        className="close-search"
        onClick={() => setSearchTarget(null)}
        type="button"
      >
        ✕
      </button>
    </div>

    {/* ✅ 검색 탭 */}
    {panelTab === "search" && (
      <>
        <input
          className="search-input"
          placeholder="장소 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

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
                    {String(place.types[0]).replace(/_/g, " ")}
                  </span>
                )}

                <div className="search-address">{place.address}</div>

                {place.openNow !== null && place.openNow !== undefined && (
                  <span
                    className={`open-status ${place.openNow ? "open" : "closed"}`}
                  >
                    {place.openNow ? "영업중 🔥" : "영업종료 ❌"}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </>
    )}

    {/* ✅ 좋아요 탭 */}
    {panelTab === "likes" && (
      <div className="liked-list">
        {likedLoading && <div className="liked-empty">불러오는 중...</div>}

        {!likedLoading && likedPlaces.length === 0 && (
          <div className="liked-empty">좋아요한 여행지가 없어요</div>
        )}

        {!likedLoading &&
          likedPlaces.map((item) => {
            const place = normalizeLikedToSearchPlace(item);
            return (
              <div key={place.placeId} className="liked-item">
                <img
  src={place.image || (process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg")}
  className="liked-thumb"
  alt={place.name}
  onError={(e) =>
    (e.currentTarget.src = process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg")
  }
/>
                <div className="liked-info">
                  <div className="liked-title">{place.name}</div>
                  <div className="liked-address">{place.address}</div>
                </div>

                <button
                  className="liked-add-btn"
                  type="button"
                  onClick={() => handleAddPlace(place)}
                >
                  추가
                </button>
              </div>
            );
          })}
      </div>
    )}
  </div>
)}
      </div>
    </div>
  );
}