import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../../../styles/side/mypage/Calendar.css";

export default function CalendarBox() {
  const [value, setValue] = useState(new Date());

  return (
    <div className="calendar-wrapper">
      <Calendar onChange={setValue} value={value} />
    </div>
  );
}
