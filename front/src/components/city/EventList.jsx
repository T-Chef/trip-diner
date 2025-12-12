// front/src/components/city/EventList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import EventCard from "./EventCard";
import "../../styles/page/city/EventList.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function EventList({ filter }) {
  const { areaCode, sigunguCode } = filter;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!areaCode) {
      setEvents([]);
      setErrorMsg(null);
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await axios.get(`${API_BASE}/event/list`, {
          params: { areaCode, sigunguCode },
        });

        const raw = res.data;
      let list = [];

      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && Array.isArray(raw.data)) {
        list = raw.data;
        if (raw.message) setErrorMsg(raw.message);
      } else if (raw && raw.ok === false) {
        setErrorMsg(
          raw.message ||
            "축제/이벤트 목록을 가져오는 중 문제가 발생했습니다."
        );
      }

      setEvents(list.slice(0, 6));
    } catch (err) {
      console.error("🔥 이벤트 목록 로드 실패:", err);
      setErrorMsg(
        "지금 이벤트 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      );
      // setEvents([]);  ← 기존 데이터 유지
    } finally {
      setLoading(false);
    }
  };

    fetchEvents();
  }, [areaCode, sigunguCode]);

  if (!areaCode) {
    return (
    <div className="event-empty">
      지역을 선택하면 진행 중인 축제·이벤트를 보여드릴게요.
    </div>
    );
  }

  if (loading) return <div className="event-loading">이벤트 불러오는 중...</div>;

  if (!events.length) {
    return (
    <div className="event-empty">
      {errorMsg
        ? errorMsg
        : "현재 선택한 지역에 진행 중인 이벤트가 없습니다."}
    </div>
  );
}

  return (
    <div className="event-list-grid">
      {events.map((ev) => (
        <EventCard key={ev.contentId} item={ev} />
      ))}
    </div>
  );
}
