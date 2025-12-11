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

  useEffect(() => {
    if (!areaCode) {
      setEvents([]);
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/event/list`, {
          params: { areaCode, sigunguCode },
        });

        const data = res.data || [];
        setEvents(data.slice(0, 6)); // 일단 상위 6개 정도만
      } catch (err) {
        console.error("🔥 이벤트 목록 로드 실패:", err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [areaCode, sigunguCode]);

  if (!areaCode) {
    return <div className="event-empty">지역을 선택하면 진행 중인 축제·이벤트를 보여드릴게요.</div>;
  }

  if (loading) return <div className="event-loading">이벤트 불러오는 중...</div>;

  if (!events.length) {
    return <div className="event-empty">현재 선택한 지역에 진행 중인 이벤트가 없습니다.</div>;
  }

  return (
    <div className="event-list-grid">
      {events.map((ev) => (
        <EventCard key={ev.contentId} item={ev} />
      ))}
    </div>
  );
}
