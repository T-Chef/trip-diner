// front/src/pages/side/schedule/AIScheduleSummary.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import AIScheduleMap from "./AIScheduleMap.jsx";
import "../../../styles/side/schedule/AIScheduleSummary.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API_BASE = "http://localhost:4000/api";

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
  return CATEGORY_LABELS[normalized] || String(raw).replace(/_/g, " ");
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function parseTimeRange(timeStr) {
  if (!timeStr) return { startTime: null, endTime: null };
  const s = String(timeStr).replace(/\s+/g, "");
  const parts = s.split(/-|~|–/);
  if (parts.length >= 2) return { startTime: parts[0] || null, endTime: parts[1] || null };
  return { startTime: null, endTime: null };
}

// ✅ DB의 plan(상세) -> aiPlan 형태로 변환
function buildAiPlanFromDb(plan) {
  const memo = safeJsonParse(plan.memo);
  const themes = memo?.themes || [];
  const cityName = plan.city?.name || memo?.cityName || "";
  const peopleType = memo?.peopleType || null;

  const days = (plan.plan_day || [])
    .slice()
    .sort((a, b) => Number(a.day_index) - Number(b.day_index))
    .map((d) => {
      const places = (d.plan_item || [])
        .slice()
        .sort((a, b) => Number(a.order_index) - Number(b.order_index))
        .map((it) => {
          const pl = it.place || {};
          const { startTime, endTime } = parseTimeRange(it.time);

          return {
            name: pl.name || "이름 없음",
            address: pl.address || "",
            lat: pl.lat ?? null,
            lng: pl.lng ?? null,
            image: pl.image_url || null,
            description: pl.description || "",
            category: pl.category ? [pl.category] : [],
            startTime,
            endTime,
            // 혹시 나중에 필요하면:
            // placeId: pl.external_id || null,
          };
        });

      return { day: Number(d.day_index), places };
    });

  return {
    title: plan.title || "여행 일정",
    cityName,
    peopleType,
    themes,
    days,
    daysCount: days.length,
  };
}

export default function AIScheduleSummary() {
  const pdfRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const planId = searchParams.get("planId"); // ✅ /trip/summary?planId=123
  const stateAiPlan = location.state?.aiPlan;

  const fromMyTrips = location.state?.from === "my-trips" || !!planId;
  const handleConfirm = () => {
    navigate("/my-trips");
  };

  const [aiPlan, setAiPlan] = useState(stateAiPlan || null);

  const downloadPDF = async () => {
  const element = pdfRef.current;
  if (!element) return;

  const prevScrollY = window.scrollY;

  try {
    element.classList.add("pdf-capture");
    await new Promise((r) => setTimeout(r, 50));

    window.scrollTo(0, 0);

    const scale = Math.min(3, window.devicePixelRatio * 2);

    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const title = (aiPlan?.title || aiPlan?.cityName || "trip-plan").replace(
      /[\\/:*?"<>|]/g,
      "_"
    );

    pdf.save(`${title}.pdf`);
  } catch (e) {
    console.error(e);
    alert("PDF 저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
  } finally {
    // ✅ 어떤 상황에서도 원복!
    element.classList.remove("pdf-capture");
    window.scrollTo(0, prevScrollY);
  }
};
  
  const [loading, setLoading] = useState(false);

  const themes = useMemo(() => {
    if (aiPlan?.themes?.length) return aiPlan.themes;
    return location.state?.themes || [];
  }, [aiPlan, location.state]);

  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [mapFilter, setMapFilter] = useState("ALL");

  // ✅ 저장된 일정 상세 불러오기
  useEffect(() => {
    const run = async () => {
      if (!planId) return;          // planId 없으면 기존처럼 state aiPlan 렌더
      if (stateAiPlan) return;      // state로 이미 aiPlan 넘어온 경우 fetch 불필요

      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/plan/${planId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success && res.data.plan) {
          const converted = buildAiPlanFromDb(res.data.plan);
          setAiPlan(converted);
          setMapFilter("ALL");
          setActiveDayIdx(0);
        } else {
          alert("일정을 불러오지 못했습니다.");
        }
      } catch (e) {
        console.error("plan detail load error:", e);
        alert("일정 불러오기 실패");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [planId, stateAiPlan, navigate]);

const handleSaveMyPlan = () => {
  // ✅ 상세보기(이미 저장된 일정) 화면에서는 저장 버튼 막기
  if (planId) {
    alert("이미 저장된 일정입니다.");
    return;
  }

  const token = localStorage.getItem("accessToken");
  if (!token) {
    alert("로그인이 필요합니다.");
    navigate("/login");
    return;
  }

  // ✅ DB 저장이 아니라 달력 페이지로 이동
  navigate("/schedule/pick-start-date", {
    state: { aiPlan, themes },
  });
};



  const handleBackEdit = () => {
    // aiPlan이 있으니 그대로 편집 화면으로 돌려보내기 가능
    navigate("/trip/result", { state: { aiPlan, themes } });
  };

  const handleSharePlan = () => {
    alert("공유하기 기능은 나중에 링크/이미지 공유로 연결할 예정입니다!");
  };

  if (loading) return <div className="summary-empty">불러오는 중...</div>;

  if (!aiPlan || !aiPlan.days) {
    return <div className="summary-empty">⚠️ 요약할 일정이 없습니다.</div>;
  }

  const totalDays = aiPlan.daysCount || aiPlan.days.length || 1;
  const nights = Math.max(totalDays - 1, 0);

  const visibleDays =
    mapFilter === "ALL" ? aiPlan.days : [aiPlan.days[activeDayIdx]];

    return (
    <div className="summary-page">
      {/* ✅ 지도는 PDF 제외 (캡쳐 안정성) */}
      <section className="summary-map-section" data-html2canvas-ignore="true">
        <AIScheduleMap
          aiPlan={aiPlan}
          activePlace={null}
          onSelectPlace={() => {}}
          selectedDayExternal={mapFilter}
        />
      </section>

      {/* ✅ 여기부터 PDF로 저장될 영역 */}
      <div ref={pdfRef}>
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

        <section className="summary-day-tabs">
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
                setActiveDayIdx(idx);
                setMapFilter(day.day);
              }}
            >
              Day {day.day}
            </button>
          ))}
        </section>

        {visibleDays.map((day) => (
          <section key={day.day} className="summary-day-section">
            <h2 className="summary-day-title">Day {day.day}</h2>

            <div className="summary-card-list">
              {day.places.map((p, idx) => (
                <article key={`${day.day}-${idx}`} className="summary-card">
                  <div className="summary-card-thumb">
                    <img
                      src={p.image || "/assets/images/default-placeholder.jpg"}
                      onError={(e) =>
                        (e.target.src = "/assets/images/default-placeholder.jpg")
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
      </div>

      {/* ✅ footer는 화면엔 보이되, 버튼영역은 PDF 제외 */}
      <footer className="summary-footer">
        <p className="summary-footer-title">추천일정이 마음에 드시나요?</p>
        <p className="summary-footer-text">
          마음에 드는 일정을 내 일정으로 담으면 언제든지 확인하고 편집할 수 있어요.
        </p>

        <div className="summary-footer-actions" data-html2canvas-ignore="true">
          <button
            className="btn-save"
            onClick={fromMyTrips ? handleConfirm : handleSaveMyPlan}
          >
            {fromMyTrips ? "확인 ✅" : "내 일정으로 담기 📘"}
          </button>

          <button className="btn-back-edit" onClick={handleBackEdit}>
            다시 편집 화면으로 ✏️
          </button>

          <button className="btn-share" onClick={handleSharePlan}>
            공유하기 📤
          </button>

          {/* ✅ 공유하기 옆 PDF 버튼 */}
          <button className="btn-pdf" onClick={downloadPDF}>
            PDF 저장 🧾
          </button>
        </div>
      </footer>
    </div>
  );
}