// src/components/city/WeatherBox.jsx
import React from "react";
import "../../../styles/side/city/WeatherBox.css";

export default function WeatherBox({ weather, forecast }) {
  if (!weather)
    return <div className="weather-box">날씨 정보를 불러오는 중...</div>;

  return (
    <div className="weather-box">
      <div className="weather-left">
        <div className="temp">{weather.temp}°</div>
        <div className="condition">{weather.desc}</div>
        <div className="location">{weather.city}</div>
      </div>

      <div className="weather-right">
        <img src={weather.icon} alt="icon" />
      </div>

      {/* ✅ 3시간 예보 (세로 스크롤) */}
      <div className="forecast-box">
        {forecast?.map((f, idx) => (
          <div key={idx} className="forecast-item">
            <div className="f-time">{f.dt_txt.slice(11, 16)}</div>
            <div className="f-mid">
              <div className="f-temp">{Math.round(f.main.temp)}°</div>
              <div className="f-desc">{f.weather?.[0]?.description}</div>
            </div>
            <img
              className="f-icon"
              src={`https://openweathermap.org/img/w/${f.weather[0].icon}.png`}
              alt=""
            />
          </div>
        ))}
      </div>
    </div>
  );
}
