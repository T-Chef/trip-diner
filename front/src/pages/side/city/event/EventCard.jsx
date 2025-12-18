// front/src/components/city/EventCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../../../styles/side/city/event/EventCard.css";

export default function EventCard({ item }) {
  const navigate = useNavigate();

  const { contentId, contentTypeId, title, address, image, startDate, endDate } = item;

  const fmt = (yyyymmdd) => {
    if (!yyyymmdd) return "";
    const y = yyyymmdd.slice(0, 4);
    const m = yyyymmdd.slice(4, 6);
    const d = yyyymmdd.slice(6, 8);
    return `${y}.${m}.${d}`;
  };

  const handleClick = () => {
    if (!contentId) return;
    const type = contentTypeId || 15;

    // ✅ 새로고침/직접 접근 대비: baseEvent 저장
    const baseKey = `eventBase:${contentId}|${type}`;
    sessionStorage.setItem(baseKey, JSON.stringify(item));

    navigate(`/event/${contentId}?type=${type}`, {
      state: { baseEvent: item },
    });
  };

  return (
    <div className="event-card" onClick={handleClick}>
      <div className="event-thumb-wrap">
        <img
          src={image || "/assets/images/default-placeholder.jpg"}
          alt={title}
          onError={(e) => {
            e.target.src = "/assets/images/default-placeholder.jpg";
          }}
        />
      </div>

      <div className="event-info">
        <h3 className="event-title" title={title}>{title}</h3>
        <p className="event-date">{fmt(startDate)} ~ {fmt(endDate)}</p>
        <p className="event-address">{address || "주소 정보 없음"}</p>
      </div>
    </div>
  );
}
