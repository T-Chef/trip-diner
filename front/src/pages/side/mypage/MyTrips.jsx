import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/MyTrips.css";

const API_BASE = "http://localhost:4000/api";

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function formatKoreanDate(d) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function MyTrips({ user }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("이 일정을 삭제할까요?")) return;

      const token = localStorage.getItem("accessToken");
      if (!token) return alert("로그인이 필요합니다.");

      await axios.delete(`${API_BASE}/plan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPlans((prev) => prev.filter((p) => String(p.plan_id) !== String(id)));
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("삭제 실패! 콘솔 확인");
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        // 로그인 안 된 상태면 프로필로 보내거나 로그인으로 보내도 됨
        if (!user) {
          setPlans([]);
          return;
        }

        // ✅ requireAuth가 쿠키 기반이면 withCredentials 필요
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(`${API_BASE}/plan`, {
         headers: {
         Authorization: `Bearer ${token}`,
        },
        });

        console.log("✅ /api/plan status:", res.status);
        console.log("✅ /api/plan data:", res.data);

        if (res.data?.success) setPlans(res.data.plans || []);
        else setPlans([]);
      } catch (e) {
        console.error("내 일정 불러오기 실패:", e);
        // 401이면 로그인 페이지로 보내고 싶으면:
        // if (e?.response?.status === 401) navigate("/login");
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user, navigate]);

  if (!user) return <div className="mytrips-wrap">로그인이 필요합니다.</div>;
  if (loading) return <div className="mytrips-wrap">불러오는 중...</div>;

  // plan -> 카드용 데이터로 변환
  const cards = plans.map((p) => {
    const memo = safeJsonParse(p.memo);
    const themes = memo?.themes || [];
    const cityName = p.city?.name || memo?.cityName || "";
    const dayCount = Array.isArray(p.plan_day) ? p.plan_day.length : 0;

    // 썸네일/미리보기 이미지: 첫 3개 place.image_url 뽑기
    const allPlaces =
      (p.plan_day || []).flatMap((d) => (d.plan_item || []).map((it) => it.place).filter(Boolean));

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
                <div className="badge">
                  {c.dayCount >= 2 ? `${c.dayCount - 1}박${c.dayCount}일` : c.dayCount ? `${c.dayCount}일` : "여행"}
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
