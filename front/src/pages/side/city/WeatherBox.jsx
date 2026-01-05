// src/components/city/WeatherBox.jsx
import React from "react";
import "../../../styles/side/city/WeatherBox.css";

export default function WeatherBox({
  weather,
  forecast,
  overview,
  loadingOverview,
  onPickArea,
}) {
  // ✅ 1) 전체 모드(overview)
  if (Array.isArray(overview)) {
    return (
      <div className="weather-box weather-overview">
        <div className="weather-head">
          <div className="weather-line">
            <span className="w-city">전국 주요 도시</span>
            <span className="w-dot">·</span>
            <span className="w-desc">오늘 날씨</span>
          </div>
        </div>

        {loadingOverview ? (
          <div className="weather-empty">날씨 불러오는 중...</div>
        ) : overview.length ? (
          <div className="wx-mini-grid">
            {overview.map((w) => (
              <button
                key={w.areaCode ?? w.city}
                className="wx-mini-item"
                type="button"
                onClick={() => onPickArea?.(w.areaCode)}
                title={`${w.city} ${w.desc} ${w.temp}°`}
              >
                <span className="wx-mini-city">{w.city}</span>
                <span className="wx-mini-temp">{w.temp}°</span>
                <img className="wx-mini-ico" src={w.icon} alt="" />
              </button>
            ))}
          </div>
        ) : (
          <div className="weather-empty">
            주요 도시 날씨를 불러오지 못했어요.
            <br />
            오른쪽에서 지역을 선택해 주세요.
          </div>
        )}
      </div>
    );
  }

  // ✅ 2) 선택 도시 모드
  if (!weather)
    return <div className="weather-box">날씨 정보를 불러오는 중...</div>;

  const formatTime = (f) => {
    const d = new Date((f.dt ?? 0) * 1000);
    return d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="weather-box">
      <div className="weather-head">
        <div
          className="weather-line"
          title={`${weather.city} ${weather.desc} ${weather.temp}°`}
        >
          {/* ✅ 왼쪽: 도시 + 설명(여기만 ellipsis) */}
          <div className="w-left">
            <span className="w-city">{weather.city}</span>
            <span className="w-dot">·</span>
            <span className="w-desc">{weather.desc}</span>
          </div>

          {/* ✅ 오른쪽: 온도 + 아이콘(항상 보이게) */}
          <div className="w-right">
            <span className="w-temp">{weather.temp}°</span>
            <img className="w-icon" src={weather.icon} alt="weather icon" />
          </div>
        </div>
      </div>

      <div className="forecast-box">
        {forecast?.map((f, idx) => (
          <div key={idx} className="forecast-item">
            <div className="f-time">{formatTime(f)}</div>

            <div className="f-mid">
              <div className="f-temp">{Math.round(f.main.temp)}°</div>
              <div className="f-desc">{f.weather?.[0]?.description}</div>
            </div>

            <img
              className="f-icon"
              src={`https://openweathermap.org/img/w/${f.weather?.[0]?.icon}.png`}
              alt=""
            />
          </div>
        ))}
      </div>
    </div>
  );
}
