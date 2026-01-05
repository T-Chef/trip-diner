// AIScheduleResult.jsx
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AIScheduleMap from "./AIScheduleMap.jsx";
import "../../../styles/side/schedule/AIScheduleResult.css";
import axios from "axios";
import { placeLikesApi } from "../../../api/placeLikesApi";

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

  const normalized = String(raw).toLowerCase().replace(/\s+/g, "_");
  const mapped = CATEGORY_LABELS[normalized];

  return mapped || String(raw).replace(/_/g, " ");
}

// ✅ 거리 계산용 (하루 동선 km)
function distanceKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0;

  const R = 6371;
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

  const [highlight, setHighlight] = useState(null); // {day, index} 또는 null
  const [selectedPlace, setSelectedPlace] = useState(null);
  const API_BASE = "http://localhost:4000/api";

  // ✅ selectedPlace의 (dayIdx, placeIdx)도 같이 기억해야 "aiPlan 안에" description을 저장할 수 있음
  const [selectedPos, setSelectedPos] = useState(null);
  const [descLoading, setDescLoading] = useState(false);
  const handleSelectFromMap = (...args) => {
  // ✅ Map이 보내는 형태가 2가지일 수 있음
  // 1) (dayIdx, placeIdx)
  // 2) (place, dayIdx, placeIdx)
  let place = null;
  let dayIdx = null;
  let placeIdx = null;

  if (typeof args[0] === "number") {
    dayIdx = args[0];
    placeIdx = args[1];
  } else {
    place = args[0];
    dayIdx = args[1];
    placeIdx = args[2];
  }

  // ✅ dayIdx가 1부터 오는 경우(1일차=1)까지 방어
  if (
    Number.isInteger(dayIdx) &&
    aiPlan?.days &&
    !aiPlan.days[dayIdx] &&
    aiPlan.days[dayIdx - 1]
  ) {
    dayIdx = dayIdx - 1;
  }

  if (!Number.isInteger(dayIdx) || !Number.isInteger(placeIdx)) return;

  const p = place ?? aiPlan?.days?.[dayIdx]?.places?.[placeIdx];
  if (!p) return;

  setHighlight({ day: dayIdx, index: placeIdx });
  setSelectedPos({ dayIdx, placeIdx });
  setSelectedPlace(p);
};

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
    if (!p || p.description) return;
    if (!p.name) return;

    let cancelled = false;

    (async () => {
      try {
        setDescLoading(true);
        const desc = await fetchDesc(p);
        if (cancelled) return;

        patchPlaceInPlan(dayIdx, placeIdx, { description: desc });
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

  const dragRef = useRef(null); // { dayIdx, placeIdx }
  const [dragOver, setDragOver] = useState(null); // { dayIdx, placeIdx } or null

  // ✅ 같은 day 내에서 place 순서 이동
  const movePlace = (dayIdx, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;

    setAiPlan((prev) => {
      const day = prev?.days?.[dayIdx];
      if (!day) return prev;

      const places = [...(day.places || [])];
      if (!places[fromIdx] || toIdx < 0 || toIdx >= places.length) return prev;

      const [moved] = places.splice(fromIdx, 1);
      places.splice(toIdx, 0, moved);

      // highlight/selectedPos가 순서 변경에 맞게 따라가게
      setHighlight((h) => {
        if (h?.day !== dayIdx) return h;
        if (h.index === fromIdx) return { ...h, index: toIdx };
        if (fromIdx < toIdx && h.index > fromIdx && h.index <= toIdx)
          return { ...h, index: h.index - 1 };
        if (fromIdx > toIdx && h.index < fromIdx && h.index >= toIdx)
          return { ...h, index: h.index + 1 };
        return h;
      });

      setSelectedPos((pos) => {
        if (!pos || pos.dayIdx !== dayIdx) return pos;
        if (pos.placeIdx === fromIdx) return { ...pos, placeIdx: toIdx };
        if (fromIdx < toIdx && pos.placeIdx > fromIdx && pos.placeIdx <= toIdx)
          return { ...pos, placeIdx: pos.placeIdx - 1 };
        if (fromIdx > toIdx && pos.placeIdx < fromIdx && pos.placeIdx >= toIdx)
          return { ...pos, placeIdx: pos.placeIdx + 1 };
        return pos;
      });

      return {
        ...prev,
        days: prev.days.map((d, di) => (di !== dayIdx ? d : { ...d, places })),
      };
    });
  };

  // ✅ DnD 핸들러
  const onDragStartPlace = (dayIdx, placeIdx) => {
    dragRef.current = { dayIdx, placeIdx };
  };

  const onDropPlace = (targetDayIdx, targetPlaceIdx) => {
    const src = dragRef.current;
    dragRef.current = null;
    setDragOver(null);

    if (!src) return;
    if (src.dayIdx !== targetDayIdx) return;
    movePlace(targetDayIdx, src.placeIdx, targetPlaceIdx);
  };

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

  // ✅ 렌더 안전장치(절대 map 터지지 않게)
  const safeLikedPlaces = Array.isArray(likedPlaces) ? likedPlaces : [];

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
    if (cooldownMs > 0) return;
    if (recommendLockRef.current) return;

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
      setCooldownMs(5000);
    }
  };

  // ✅ 4) 다시 선택하기 버튼
  const handleReSelect = () => {
    navigate("/trip");
  };

  // ✅ 이미지/주소/카테고리 보강용 useEffect
  useEffect(() => {
    if (!rawPlan || !rawPlan.days) return;

    const enhanceAllPlaces = async () => {
      try {
        setIsEnhancing(true);

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

  // ✅ 좋아요한 여행지 불러오기
  const getUserId = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        const id =
          u?.user_id ??
          u?.userId ??
          u?.id ??
          u?.user?.user_id ??
          u?.user?.userId ??
          u?.user?.id;
        return id != null ? Number(id) : null;
      } catch {}
    }

    const direct =
      localStorage.getItem("user_id") ||
      localStorage.getItem("userId") ||
      localStorage.getItem("uid");

    return direct ? Number(direct) : null;
  };

  // ✅ 좋아요 데이터 → handleAddPlace가 받는 형태로 변환
  const normalizeLikedToSearchPlace = (row) => {
    const p = row?.place || {};
    return {
      placeId: p.external_id || row.like_id,
      name: p.name,
      address: p.address || "",
      lat: p.lat ?? null,
      lng: p.lng ?? null,
      image:
        p.image_url ||
        process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg",
      types: p.category ? [p.category] : [],
      rating: p.rating,
      reviews: p.reviews,
      openNow: p.openNow,
    };
  };

  // ✅ 좋아요 탭에서만 좋아요 목록 로드 (listByUser가 배열을 반환한다는 전제)
  useEffect(() => {
    if (!searchTarget) return;
    if (panelTab !== "likes") return;

    let cancelled = false;

    (async () => {
      try {
        setLikedLoading(true);

        const userId = getUserId();
        if (!userId) {
          console.log("❗ userId 없음 (좋아요 탭): localStorage/userAuth 확인");
          if (!cancelled) setLikedPlaces([]);
          return;
        }

        const list = await placeLikesApi.listByUser(userId); // ✅ 배열
        if (!cancelled) setLikedPlaces(list);
      } catch (e) {
        console.error("좋아요 목록 불러오기 실패:", e);
        if (!cancelled) setLikedPlaces([]);
      } finally {
        if (!cancelled) setLikedLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
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
          category: place.types?.length
            ? [String(place.types[0]).replace(/_/g, " ")]
            : [],
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

          {/* ✅ 일차별 일정 리스트 */}
          {aiPlan.days.map((day, dayIdx) => (
            <div key={day.day} className="day-block">
              <h4 className="day-header">{day.day}일차</h4>

              {day.places.map((p, placeIdx) => {
                const stableKey =
                  p.placeId ||
                  p.external_id ||
                  `${p.name}-${p.lat}-${p.lng}-${placeIdx}`;

                const isDragOver =
                  dragOver?.dayIdx === dayIdx &&
                  dragOver?.placeIdx === placeIdx;

                return (
                  <div
                    key={stableKey}
                    id={`place-${dayIdx}-${placeIdx}`}
                    className={`place-item ${isDragOver ? "drag-over" : ""} ${
                      highlight?.day === dayIdx && highlight?.index === placeIdx ? "active" : ""
                    } ${editMode ? "draggable" : ""}`}
                    draggable={!!editMode}
                    onDragStart={() => {
                      if (!editMode) return;
                      onDragStartPlace(dayIdx, placeIdx);
                    }}
                    onDragOver={(e) => {
                      if (!editMode) return;
                      e.preventDefault();
                      setDragOver({ dayIdx, placeIdx });
                    }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                      if (!editMode) return;
                      e.preventDefault();
                      onDropPlace(dayIdx, placeIdx);
                    }}
                    onClick={() => {
                      if (editMode) return;
                      setHighlight({ day: dayIdx, index: placeIdx });
                      setSelectedPos({ dayIdx, placeIdx });
                      setSelectedPlace(p);
                    }}
                  >
                    <img
                      src={p.image ?? "/assets/images/default-placeholder.jpg"}
                      onError={(e) =>
                        (e.currentTarget.src =
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
                      <div
                        className="reorder-btns"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="reorder-btn"
                          disabled={placeIdx === 0}
                          onClick={() => movePlace(dayIdx, placeIdx, placeIdx - 1)}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className="reorder-btn"
                          disabled={
                            placeIdx === (day.places?.length || 0) - 1
                          }
                          onClick={() => movePlace(dayIdx, placeIdx, placeIdx + 1)}
                        >
                          ▼
                        </button>
                      </div>
                    )}

                    {editMode && (
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAiPlan((prev) => {
                            const next = JSON.parse(JSON.stringify(prev));
                            next.days[dayIdx].places.splice(placeIdx, 1);
                            return next;
                          });
                        }}
                      >
                        ❌
                      </button>
                    )}
                  </div>
                );
              })}

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
            <button className="btn-dark" onClick={handleToggleEdit}>
              {editMode ? "편집완료 📁" : "일정편집 ✏️"}
            </button>

            <button className="btn-primary" onClick={handleConfirm}>
              확인
            </button>

            <button
              className="btn-accent"
              onClick={handleNewRecommend}
              disabled={
                recommending || recommendLockRef.current || cooldownMs > 0
              }
            >
              {recommending
                ? "새로운 추천 만드는 중..."
                : cooldownMs > 0
                ? `새로운 추천받기 (${Math.ceil(cooldownMs / 1000)}s)`
                : "새로운 추천받기 🎲"}
            </button>

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
  onSelectPlace={handleSelectFromMap}
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
                src={selectedPlace.image ?? "/assets/images/default-placeholder.jpg"}
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

              {descLoading &&
              (!selectedPlace.description || !selectedPlace.description.trim()) ? (
                <p className="place-summary">설명 불러오는 중...</p>
              ) : selectedPlace.description &&
                selectedPlace.description.trim().length > 0 ? (
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
              </>
            )}

            {/* ✅ 좋아요 탭 */}
            {panelTab === "likes" && (
              <div className="liked-list">
                {likedLoading && <div className="liked-empty">불러오는 중...</div>}

                {!likedLoading && safeLikedPlaces.length === 0 && (
                  <div className="liked-empty">좋아요한 여행지가 없어요</div>
                )}

                {!likedLoading &&
                  safeLikedPlaces.map((item) => {
                    const place = normalizeLikedToSearchPlace(item);
                    return (
                      <div key={place.placeId} className="liked-item">
                        <img
                          src={
                            place.image ||
                            process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg"
                          }
                          className="liked-thumb"
                          alt={place.name}
                          onError={(e) =>
                            (e.currentTarget.src =
                              process.env.PUBLIC_URL +
                              "/assets/images/default-thumb.jpg")
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
