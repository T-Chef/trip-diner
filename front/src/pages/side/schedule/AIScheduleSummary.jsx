// front/src/pages/side/schedule/AIScheduleSummary.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AIScheduleMap from "./AIScheduleMap.jsx";
import "../../../styles/side/schedule/AIScheduleSummary.css";

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

function getCategoryLabel(category) {
  const raw = Array.isArray(category) ? category[0] : category;
  if (!raw) return "";
  const normalized = String(raw).toLowerCase().replace(/\s+/g, "_");
  const mapped = CATEGORY_LABELS[normalized];
  return mapped || String(raw).replace(/_/g, " ");
}

export default function AIScheduleSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const aiPlan = location.state?.aiPlan;
  const themes = aiPlan?.themes || location.state?.themes || [];

  const [activeDayIdx, setActiveDayIdx] = useState(0);   // 카드용
  const [mapFilter, setMapFilter] = useState("ALL");   
  const [saving, setSaving] = useState(false);
  // 지도용: "ALL" | 1 | 2 ...
  
  const handleSaveMyPlan = async () => {
  try {
    const token = localStorage.getItem("accessToken"); // ✅ 로그인에서 받은 accessToken 저장 키
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSaving(true);

    const res = await fetch("http://localhost:4000/api/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ aiPlan, themes }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.message || "저장 실패");
      return;
    }

    alert("✅ 내 일정에 저장 완료!");
    // 원하면 저장 후 이동
    // navigate("/mypage/plans");
  } catch (e) {
    console.error(e);
    alert("저장 중 오류 발생");
  } finally {
    setSaving(false);
  }
};

  const handleBackEdit = () => { navigate("/trip/result", { state: { aiPlan, themes } }); };
  const handleSharePlan = () => { alert("공유하기 기능은 나중에 링크/이미지 공유로 연결할 예정입니다!"); };


  if (!aiPlan || !aiPlan.days) {
    return <div className="summary-empty">⚠️ 요약할 일정이 없습니다.</div>;
  }

  const totalDays = aiPlan.daysCount || aiPlan.days.length || 1;
  const nights = Math.max(totalDays - 1, 0);
  const visibleDays =
  mapFilter === "ALL"
    ? aiPlan.days
    : [aiPlan.days[activeDayIdx]];

  return (
    <div className="summary-page">
      {/* ▷ 상단 제목 영역 (동그라미 사진 제거) */}
      <header className="summary-hero">
        <h1 className="summary-title">
          {aiPlan.cityName || aiPlan.title},{" "}
          {nights}박 {totalDays}일 추천일정입니다.
        </h1>
        <p className="summary-subtitle">
          AI가 만들어 준 맞춤 일정으로 편하게 여행을 떠나보세요.
        </p>

        {themes.length > 0 && (
          <div className="summary-theme-tags">
            {themes.map((t) => (
              <span key={t} className="summary-theme-tag">
                #{t}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ▷ 지도 영역 */}
      <section className="summary-map-section">
        <AIScheduleMap
          aiPlan={aiPlan}
          activePlace={null}
          onSelectPlace={() => {}}
          selectedDayExternal={mapFilter}   // ★ 외부에서 Day 필터 넣기
        />
      </section>

      {/* ▷ Day 탭 (전체 + Day1/Day2/...) */}
      <section className="summary-day-tabs">
        {/* 전체 버튼: 지도만 ALL로, 카드 Day는 그대로 유지 */}
        <button
          className={mapFilter === "ALL" ? "day-tab active" : "day-tab"}
          onClick={() => setMapFilter("ALL")}
        >
          전체
        </button>

        {aiPlan.days.map((day, idx) => (
          <button
            key={day.day}
            className={
              mapFilter !== "ALL" && activeDayIdx === idx
                ? "day-tab active"
                : "day-tab"
            }
            onClick={() => {
              setActiveDayIdx(idx);  // 카드용 Day 변경
              setMapFilter(day.day); // 지도도 해당 Day만
            }}
          >
            Day {day.day}
          </button>
        ))}
      </section>

      {/* ▷ 선택된 Day(또는 전체) 카드 리스트 */}
{visibleDays.map((day) => (
  <section
    key={day.day}
    className="summary-day-section"
  >
    <h2 className="summary-day-title">Day {day.day}</h2>

    <div className="summary-card-list">
      {day.places.map((p, idx) => (
        <article
          key={`${day.day}-${idx}`}
          className="summary-card"
        >
          <div className="summary-card-thumb">
            <img
              src={p.image || "/assets/images/default-placeholder.jpg"}
              onError={(e) =>
                (e.target.src =
                  "/assets/images/default-placeholder.jpg")
              }
              alt={p.name}
            />
            <div className="summary-card-order">{idx + 1}</div>
          </div>

          <div className="summary-card-body">
            <h3 className="summary-card-title">{p.name}</h3>

            <div className="summary-card-meta">
              {p.category?.[0] && (
                <span className="summary-card-chip">
                  {getCategoryLabel(p.category)}
                </span>
              )}
              {p.startTime && p.endTime && (
                <span className="summary-card-time">
                  ⏰ {p.startTime} ~ {p.endTime}
                </span>
              )}
            </div>

            {p.description && (
              <p className="summary-card-desc">{p.description}</p>
            )}

            {p.address && (
              <p className="summary-card-address">{p.address}</p>
            )}
          </div>
        </article>
      ))}
    </div>
  </section>
))}

      {/* ▷ 하단 CTA */}
      <footer className="summary-footer">
  <p className="summary-footer-title">
    추천일정이 마음에 드시나요?
  </p>
  <p className="summary-footer-text">
    마음에 드는 일정을 내 일정으로 담으면 언제든지 확인하고 편집할 수 있어요.
  </p>

  <div className="summary-footer-actions">
    <button className="btn-save" onClick={handleSaveMyPlan} disabled={saving}>
    {saving ? "저장 중..." : "내 일정으로 담기 📘"}
    </button>



    <button className="btn-back-edit" onClick={handleBackEdit}>
      다시 편집 화면으로 ✏️
    </button>

    <button className="btn-share" onClick={handleSharePlan}>
      공유하기 📤
    </button>
  </div>
</footer>

    </div>
  );
}