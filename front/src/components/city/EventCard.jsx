import React from "react";
import "../../styles/page/city/EventCard.css";

export default function EventCard({ item }) {
  return (
    <div className="event-card">
      <div className="event-thumb">
        <img 
          src={item?.thumb || "/default-event.jpg"} 
          alt="이벤트"
        />
      </div>

      <div className="event-info">
        <h3 className="event-title">{item?.title || "이벤트 제목"}</h3>
        <p className="event-desc">{item?.desc || "이벤트 설명 문구"}</p>
      </div>
    </div>
  );
}
