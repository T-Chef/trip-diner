import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../../styles/side/schedule/PickStartDatePage.css";

const API_BASE = "/api";

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function normalize(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isInRange(date, start, end) {
  const t = normalize(date).getTime();
  const s = normalize(start).getTime();
  const e = normalize(end).getTime();
  return t >= s && t <= e;
}

export default function PickStartDatePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const aiPlan = state?.aiPlan ?? null;
  const themes = state?.themes ?? [];

  const [startDate, setStartDate] = useState(() => new Date());
  const [myPlans, setMyPlans] = useState([]);

  // ✅ 내 저장된 일정 불러오기
  useEffect(() => {
    const fetchMyPlans = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const res = await axios.get(`${API_BASE}/plan/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.success) setMyPlans(res.data.plans || []);
      } catch (e) {
        console.error("내 일정 불러오기 실패:", e);
      }
    };

    fetchMyPlans();
  }, []);

  const totalDays = aiPlan?.days?.length ?? 1;
  const endDate = useMemo(
    () => addDays(startDate, totalDays - 1),
    [startDate, totalDays]
  );

  if (!aiPlan?.days?.length) {
    return (
      <div style={{ padding: 24 }}>
        aiPlan이 없습니다. 뒤로 가서 다시 시도해주세요.
        <button style={{ marginLeft: 12 }} onClick={() => navigate(-1)}>
          뒤로가기
        </button>
      </div>
    );
  }

  // ✅ 저장된 일정이 해당 날짜에 존재하는지
  const hasSavedPlanOn = (date) => {
    return myPlans.some((p) => {
      if (!p.start_date || !p.end_date) return false;
      return isInRange(date, p.start_date, p.end_date);
    });
  };

  // ✅ 선택 범위 하이라이트 + 저장된 일정 표시 클래스
  const tileClassName = ({ date, view }) => {
    if (view !== "month") return "";

    const s = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const e = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate()
    );
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let cls = "";
    if (sameDay(d, s)) cls = "td-range-start";
    else if (sameDay(d, e)) cls = "td-range-end";
    else if (d > s && d < e) cls = "td-range-mid";

    if (hasSavedPlanOn(date)) cls = `${cls} td-has-saved`.trim();

    return cls;
  };

  // ✅ 저장된 일정 있는 날 점 표시
  const tileContent = ({ date, view }) => {
    if (view !== "month") return null;
    if (!hasSavedPlanOn(date)) return null;
    return <div className="td-saved-dot">•</div>;
  };

  const onCancel = () => {
    const ok = window.confirm("저장하지 않고 돌아갈까요?");
    if (!ok) return;

    navigate("/trip/summary", { state: { aiPlan, themes } });
  };

  const onSave = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE}/plan`,
        { aiPlan, themes, startDate: startDate.toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.data?.success) {
        alert(res.data?.message || "저장 실패");
        return;
      }

      alert("✅ 내 일정에 저장 완료!");
      navigate("/my-trips", { replace: true });
    } catch (e) {
      console.error(e);
      alert("저장 중 오류 발생");
    }
  };

  return (
    <div className="td-pick-wrap">
      <h2 className="td-title">일정 선택</h2>
      <p className="td-sub">여행 시작일을 선택해주세요.</p>

      <div className="td-cal">
        <Calendar
          onChange={setStartDate}
          value={startDate}
          tileClassName={tileClassName}
          tileContent={tileContent}
          calendarType="gregory"
        />
      </div>

      <div className="td-dates">
        <div className="td-datebox">
          <div className="td-label">가는날</div>
          <div className="td-value">
            {startDate.toLocaleDateString("ko-KR")}
          </div>
        </div>
        <div className="td-datebox">
          <div className="td-label">오는날</div>
          <div className="td-value">{endDate.toLocaleDateString("ko-KR")}</div>
        </div>
      </div>

      <div className="td-btn-row">
        <button type="button" className="td-btn td-btn-cancel" onClick={onCancel}>
          취소
        </button>
        <button className="td-btn td-btn-confirm" onClick={onSave}>
          선택완료
        </button>
      </div>
    </div>
  );
}
