import React from "react";
import "../../styles/page/city/WeatherBox.css";

export default function WeatherBox({ weather }) {
  // 데이터 없을 때는 Placeholder UI
  if (!weather) {
    return (
      <div className="weather-box">
        <div className="weather-left">
          <div className="temp">--°</div>
          <div className="condition">날씨 정보를 불러오는 중...</div>
        </div>
        <div className="weather-right placeholder"></div>
      </div>
    );
  }

  return (
    <div className="weather-box">
      <div className="weather-left">
        <div className="temp">{weather.temp}°</div>
        <div className="condition">{weather.desc}</div>
        <div className="location">{weather.city}</div>
      </div>

      <div className="weather-right">
        <img src={weather.icon} alt="weather icon" />
      </div>
    </div>
  );
}
