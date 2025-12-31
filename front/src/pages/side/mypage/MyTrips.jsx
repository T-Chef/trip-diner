import React, { useEffect, useState } from "react";
import api from "../../page/login/api";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/MyTrips.css";

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ✅ "2025-12-31T00:00:00.000Z" / "2025-12-31" 둘 다 처리해서 UTC Date로 변환
function parseDateUTC(val) {
  if (!val) return null;
  const ymd = String(val).slice(0, 10); // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatMonthDayUTC(dateObj) {
  if (!dateObj) return "";
  return `${dateObj.getUTCMonth() + 1}월${dateObj.getUTCDate()}일`;
}

// ✅ start/end 둘 다 있으면 dayCount 계산 (inclusive)
function calcDayCountFromDates(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const diff = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

// ✅ rangeText: endDate 있으면 그걸 쓰고, 없으면 dayCount로 계산
function makeRangeText(startDate, endDate, dayCount) {
  if (!startDate) return "";

  let e = endDate;
  if (!e && dayCount && dayCount >= 1) {
    e = new Date(startDate);
    e.setUTCDate(e.getUTCDate() + (Number(dayCount) - 1));
  }

  if (!e) return "";
  return `${formatMonthDayUTC(startDate)}~${formatMonthDayUTC(e)}`;
}

export default function MyTrips({ user }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("이 일정을 삭제할까요?")) return;

      const res = await api.delete(`/plan/${id}`);

      if (!res.data?.success) {
        alert(res.data?.message || "삭제 실패");
        return;
      }

      setPlans((prev) => prev.filter((p) => String(p.plan_id) !== String(id)));
    } catch (e) {
      console.error("삭제 실패:", e);

      if (e.response?.status === 401) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      alert("삭제 실패! 콘솔 확인");
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        if (!user) {
          setPlans([]);
          return;
        }

        const res = await api.get("/plan/my");
        console.log("✅ /api/plan status:", res.status);
        console.log("✅ /api/plan data:", res.data);

        if (res.data?.success) setPlans(res.data.plans || []);
        else setPlans([]);
      } catch (e) {
        console.error("내 일정 불러오기 실패:", e);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, navigate]);

  if (!user) return <div className="mytrips-wrap">로그인이 필요합니다.</div>;
  if (loading) return <div className="mytrips-wrap">불러오는 중...</div>;

  const cards = plans.map((p) => {
    const memo = safeJsonParse(p.memo);

    const themes = memo?.themes || [];
    const cityName = p.city?.name || memo?.cityName || "";

    // ✅ start/end (지금 네 스샷처럼 API에서 내려옴)
    const startDate = parseDateUTC(p.start_date || p.startDate || memo?.start_date || memo?.startDate);
    const endDate = parseDateUTC(p.end_date || p.endDate || memo?.end_date || memo?.endDate);

    // ✅ dayCount: plan_day가 있으면 그걸 쓰고, 없으면 start~end로 계산, 그것도 없으면 days_count류
    let dayCount = Array.isArray(p.plan_day) ? p.plan_day.length : 0;
    if (!dayCount) dayCount = calcDayCountFromDates(startDate, endDate);
    if (!dayCount) {
      dayCount = Number(p.days_count ?? p.daysCount ?? memo?.daysCount ?? memo?.days?.length ?? 0);
    }

    // ✅ (12월20일~12월22일)
    const rangeText = makeRangeText(startDate, endDate, dayCount);

    // ✅ 썸네일/미리보기 (plan_day 없으면 placeholder 뜨는 게 정상)
    const allPlaces = (p.plan_day || [])
      .flatMap((d) => (d.plan_item || []).map((it) => it.place).filter(Boolean));

    const previewImages = allPlaces
      .map((pl) => pl.image_url)
      .filter(Boolean)
      .slice(0, 3);

    const thumb = previewImages[0] || "/assets/images/default-placeholder.jpg";

    return {
      id: p.plan_id,
      title: p.title || "여행 일정",
      cityName,
      dayCount,
      createdAt: (p.created_at || "").slice(0, 10),
      themes,
      thumb,
      previewImages,
      rangeText,
    };
  });

  return (
    <div className="mytrips-wrap">
      <div className="mytrips-head">
        <h2>나의 여행코스</h2>
        <button className="danger" onClick={() => alert("전체 삭제는 추후 연결")}>
          전체 코스 삭제
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="empty">저장된 일정이 없습니다.</div>
      ) : (
        <div className="mytrips-grid">
          {cards.map((c) => (
            <div className="trip-card" key={c.id}>
              <button className="xbtn" onClick={() => handleDelete(c.id)}>×</button>

              <div className="trip-hero">
                <img
                  src={c.thumb}
                  alt={c.title}
                  onError={(e) => (e.currentTarget.src = "/assets/images/default-placeholder.jpg")}
                />
              </div>

              <div className="trip-body">
                <div className="badge-row">
                  <div className="badge">
                    {c.dayCount >= 2
                      ? `${c.dayCount - 1}박${c.dayCount}일`
                      : c.dayCount
                        ? `${c.dayCount}일`
                        : "여행"}
                  </div>

                  {c.rangeText && <div className="date-range">({c.rangeText})</div>}
                </div>

                <h3 className="title">{c.title}</h3>
                <div className="sub">{c.cityName}</div>
                <div className="meta">만든날짜 | {c.createdAt}</div>

                <div className="tags">
                  {(c.themes || []).slice(0, 6).map((t) => (
                    <span key={t}>#{t}</span>
                  ))}
                </div>

                <div className="thumbs">
                  {(c.previewImages || []).slice(0, 3).map((src, i) => (
                    <img key={i} src={src} alt="" />
                  ))}

                  <button
                    className="more"
                    onClick={() => navigate(`/trip/summary?planId=${c.id}`, { state: { from: "my-trips" } })}
                  >
                    자세히보기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
