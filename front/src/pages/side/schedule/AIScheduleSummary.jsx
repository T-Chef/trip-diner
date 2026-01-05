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
            contentId: pl.content_id ?? pl.contentId ?? pl.external_id ?? null,      // TourAPI contentId
            contentTypeId: pl.content_type_id ?? pl.contentTypeId ?? null,           // TourAPI contentTypeId(예: 12)
            areaCode: pl.area_code ?? pl.areaCode ?? memo?.areaCode ?? null,         // 지역코드(예: 부산 6)
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

async function mapLimit(items, limit, mapper) {
  const results = [];
  let i = 0;

  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await mapper(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}
function toProxyImage(url) {
  if (!url) return "";
  const u = String(url);

  // ✅ 외부(http/https)면 프록시로 바꿔서 가져오기
  if (/^https?:\/\//i.test(u)) {
    return `${API_BASE}/proxy/image?url=${encodeURIComponent(u)}`;
  }

  // ✅ 로컬(/assets/...)이면 그대로
  return u;
}

export default function AIScheduleSummary() {
  useEffect(() => {
    document.body.classList.add("summary-mode");
    return () => document.body.classList.remove("summary-mode");
  }, []);
  const pdfRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const openPlaceDetail = (p) => {
  const contentId =
    p?.contentId ?? p?.content_id ?? p?.placeId ?? p?.external_id ?? null;

  const type =
    p?.contentTypeId ?? p?.content_type_id ?? 12; // 보통 관광지/행사면 다르게 올 수 있음

  const area =
    p?.areaCode ?? p?.area_code ?? 0; // area 없으면 0으로라도

  if (!contentId) {
    alert("이 장소는 상세페이지로 이동할 ID(contentId)가 없어요. (DB/AI 저장 시 external_id 저장 필요)");
    console.log("상세이동 실패 place:", p);
    return;
  }

  navigate(`/place/${contentId}?area=${area}&type=${type}`);
};


  const planId = searchParams.get("planId"); // ✅ /trip/summary?planId=123
  const stateAiPlan = location.state?.aiPlan;

  const fromMyTrips = location.state?.from === "my-trips" || !!planId;
  const handleConfirm = () => {
    navigate("/my-trips");
  };

  const [aiPlan, setAiPlan] = useState(stateAiPlan || null);
  // ✅ Summary에서 description 채우는 중인지
const [descFilling, setDescFilling] = useState(false);

// ✅ aiPlan 내부 특정 place 업데이트 유틸
const patchPlace = (dayIdx, placeIdx, patch) => {
  setAiPlan((prev) => {
    if (!prev?.days?.[dayIdx]?.places?.[placeIdx]) return prev;

    return {
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
  });
};
async function waitForImages(rootEl) {
  const imgs = Array.from(rootEl.querySelectorAll("img"));

  await Promise.all(
    imgs.map(async (img) => {
      try {
        // 이미 로드 됐으면 decode까지 기다리기
        if (img.complete && img.naturalWidth > 0) {
          if (img.decode) await img.decode();
          return;
        }

        // 로딩 중이면 onload/onerror 기다리기
        await new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });

        if (img.decode) await img.decode();
      } catch {
        // decode 실패해도 그냥 진행
      }
    })
  );
}

  const downloadPDF = async () => {
  const root = pdfRef.current;
  if (!root) return;

  const prevScrollY = window.scrollY;

  // ✅ PDF에 넣을 섹션들: (옵션) hero는 1페이지에 따로, day는 각 페이지로
  const heroEl = root.querySelector(".summary-hero");
  const daySections = Array.from(root.querySelectorAll(".summary-day-section"));

  // ✅ 1페이지에 hero + Day1 같이 넣기
let firstWrapper = null;
let heroPh = null;
let day1Ph = null;

const chunks = [];

if (heroEl && daySections.length > 0) {
  const day1 = daySections[0];

  // 원래 위치 복구용 placeholder 2개
  heroPh = document.createElement("div");
  heroPh.style.display = "none";
  heroEl.parentNode.insertBefore(heroPh, heroEl);

  day1Ph = document.createElement("div");
  day1Ph.style.display = "none";
  day1.parentNode.insertBefore(day1Ph, day1);

  // hero + day1 묶을 wrapper
  firstWrapper = document.createElement("div");
  firstWrapper.className = "pdf-firstpage";

  // hero 자리(placeholder 위치)에 wrapper 삽입
  heroPh.parentNode.insertBefore(firstWrapper, heroPh);

  // hero + day1을 wrapper로 이동
  firstWrapper.appendChild(heroEl);
  firstWrapper.appendChild(day1);

  // 첫 페이지 chunk는 wrapper
  chunks.push(firstWrapper);

  // 나머지 Day들만 따로 페이지
  for (let i = 1; i < daySections.length; i++) chunks.push(daySections[i]);
} else {
  // fallback: 기존처럼
  if (heroEl) chunks.push(heroEl);
  chunks.push(...daySections);
}

  // (선택) B) 1페이지에 hero+Day1 같이 넣고 싶으면 말해줘. 그 버전도 줄게.

  try {
    root.classList.add("pdf-capture");
    await new Promise((r) => setTimeout(r, 50));
    window.scrollTo(0, 0);

    const scale = Math.min(3, window.devicePixelRatio * 2);

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;

    // ✅ 캔버스 한 장을 PDF에 넣고, 넘치면 같은 캔버스를 잘라 여러 페이지로 추가
    const addCanvasToPdf = (canvas, isFirstPage) => {
      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      if (!isFirstPage) pdf.addPage();

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    };

    // ✅ 섹션(하루)마다 캡처 → 무조건 새 페이지 시작
    for (let i = 0; i < chunks.length; i++) {
      const el = chunks[i];

      // 이미지 로딩 대기(프록시 적용된 img 포함)
      await waitForImages(el);

      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        scrollY: 0,
        scrollX: 0,
      });

      addCanvasToPdf(canvas, i === 0);
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
  // ✅ hero/day1 원래 자리로 복구
  try {
    if (firstWrapper && heroPh && day1Ph) {
      const hero = firstWrapper.querySelector(".summary-hero");
      const day1 = firstWrapper.querySelector(".summary-day-section");

      if (hero) heroPh.parentNode.insertBefore(hero, heroPh);
      if (day1) day1Ph.parentNode.insertBefore(day1, day1Ph);

      heroPh.remove();
      day1Ph.remove();
      firstWrapper.remove();
    }
  } catch {}

  root.classList.remove("pdf-capture");
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
  // ✅ Summary 들어오면 description 없는 장소들 전부 채우기
useEffect(() => {
  if (!aiPlan?.days?.length) return;

  let cancelled = false;

  (async () => {
    // ✅ description 비어있는 애들만 수집
    const targets = [];
    aiPlan.days.forEach((day, dayIdx) => {
      (day.places || []).forEach((p, placeIdx) => {
        const hasDesc = p?.description && String(p.description).trim().length > 0;
        if (!hasDesc && p?.name) {
          targets.push({
            dayIdx,
            placeIdx,
            name: p.name,
            address: p.address || "",
          });
        }
      });
    });

    if (targets.length === 0) return;

    try {
      setDescFilling(true);

      // ✅ 동시성 2 추천 (너무 올리면 OpenAI/요금/레이트 영향)
      await mapLimit(targets, 2, async (t) => {
        try {
          const resp = await axios.get(`${API_BASE}/ai/description`, {
            params: { name: t.name, address: t.address },
          });
          if (cancelled) return;

          patchPlace(t.dayIdx, t.placeIdx, {
            description: resp.data.description,
          });
        } catch (e) {
          console.error("summary description fetch fail:", t.name, e);
        }
      });
    } finally {
      if (!cancelled) setDescFilling(false);
    }
  })();

  return () => {
    cancelled = true;
  };
}, [aiPlan]);

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
  <div
  className="summary-bg"
  style={{
    backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${process.env.PUBLIC_URL}/assets/images/trip-bg.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
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
                <article
  key={`${day.day}-${idx}`}
  className="summary-card"
  onClick={() => openPlaceDetail(p)}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === "Enter" && openPlaceDetail(p)}
  style={{ cursor: "pointer" }}
>

                  <div className="summary-card-thumb">
                    <img
  crossOrigin="anonymous"
  referrerPolicy="no-referrer"
  loading="eager"
  src={toProxyImage(p.image) || "/assets/images/default-placeholder.jpg"}
  onError={(e) => {
    e.currentTarget.src = "/assets/images/default-placeholder.jpg";
  }}
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

                    {descFilling && (!p.description || !p.description.trim()) ? (
  <p className="summary-card-desc">설명 불러오는 중...</p>
) : p.description && p.description.trim().length > 0 ? (
  <p className="summary-card-desc">{p.description}</p>
) : null}
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
          <button className="btn-pdf" onClick={downloadPDF} disabled={descFilling}>
  {descFilling ? "설명 채우는 중..." : "PDF 저장 🧾"}
</button>
        </div>
      </footer>
    </div>
    </div>
  );
}