
// front/src/pages/side/mypage/Calendar.jsx
import React, { useEffect, useState } from "react";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../../styles/side/mypage/Calendar.css";

import api from "../../../api/axiosInstance";

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

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ✅ 날짜칸에 보여줄 라벨 만들기: "제주 여행" 처럼
function makeLabel(plan) {
  const memo = plan.memo ? safeJsonParse(plan.memo) : null;
  const city = plan.city?.name || memo?.cityName || "";
  if (city) return `${city} 여행`;

  const title = plan.title || "여행";
  return title.length > 10 ? `${title.slice(0, 10)}…` : title;
}

// ✅ 이 날짜가 plan의 시작/중간/끝인지 판별
function getRangePos(plan, date) {
  const s = plan.start_date ?? plan.startDate;
  const e = plan.end_date ?? plan.endDate;
  if (!s || !e) return "mid";

  const ds = normalize(s).getTime();
  const de = normalize(e).getTime();
  const dd = normalize(date).getTime();

  if (dd === ds && dd === de) return "single";
  if (dd === ds) return "start";
  if (dd === de) return "end";
  return "mid";
}

export default function MyPageCalendar() {
  const [value, setValue] = useState(new Date());
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
    try {
      const res = await api.get("/api/plan/my"); 
      if (res.data?.success) setPlans(res.data.plans || []);
      else setPlans([]);
    } catch (e) {
      console.error("달력용 plan 불러오기 실패:", e);
      setPlans([]);
    }
  };

  fetchPlans();
}, []);

  // ✅ 이 날짜에 걸리는 플랜들 전부 찾기
  const plansOnDate = (date) => {
    return plans.filter((p) => {
      const s = p.start_date ?? p.startDate;
      const e = p.end_date ?? p.endDate;
      if (!s || !e) return false;
      return isInRange(date, s, e);
    });
  };

  return (
    <div className="mypage-cal-wrap">
      <Calendar
        value={value}
        onChange={setValue}
        calendarType="gregory"
        tileClassName={({ date, view }) => {
          if (view !== "month") return "";
          return plansOnDate(date).length ? "td-has-saved" : "";
        }}
        tileContent={({ date, view }) => {
          if (view !== "month") return null;

          const list = plansOnDate(date);
          if (list.length === 0) return null;

          const show = list.slice(0, 2);

          return (
            <div className="td-plan-badges">
              {show.map((p) => {
                const pos = getRangePos(p, date); // start / mid / end / single
                return (
                  <div
                    key={p.plan_id}
                    className={`td-plan-badge td-${pos}`}
                    title={p.title || ""}
                  >
                    {/* ✅ 중간(mid)은 글자 안 보여주면 이어진 바 느낌 더 강함 */}
                    {pos === "mid" ? "" : makeLabel(p)}
                  </div>
                );
              })}

              {list.length > 2 && (
                <div className="td-plan-more">+{list.length - 2}</div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
