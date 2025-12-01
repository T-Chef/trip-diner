import React, { useEffect, useRef, useState } from "react";

const MapWithPlan = ({ aiPlan, onSelectPlace }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [selectedDay, setSelectedDay] = useState("ALL"); // ⭐ 선택된 날짜(기본 전체)

  const dayColors = ["#0078ff", "#1ec800", "#ff3b30", "#ff9500", "#9b59b6"];

  useEffect(() => {
    loadMap();
  }, [aiPlan, selectedDay]); // ⭐ 날짜 바뀌면 지도 다시 그림

  const loadMap = () => {
    const scriptId = "naver-map-sdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=1o7cfked5o&submodules=marker";
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else initMap();
  };

  const initMap = () => {
    if (!mapRef.current || !window.naver) return;

    if (!mapInstance.current) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        zoom: 11,
        center: new window.naver.maps.LatLng(37.5665, 126.9780),
      });
    }

    // 삭제
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!aiPlan || aiPlan.length === 0) return;

    const bounds = new window.naver.maps.LatLngBounds();

    aiPlan.forEach((dayPlan, dayIndex) => {
      // ⭐ 필터 처리 (selectedDay가 ALL이거나, 현재 dayIndex가 선택된 날짜와 같으면 표시)
      if (selectedDay !== "ALL" && selectedDay !== dayIndex + 1) return;

      const color = dayColors[dayIndex % dayColors.length];
      let path = [];
      let markerNumber = 1;

      dayPlan.places.forEach((place, placeIndex) => {
        const latlng = new window.naver.maps.LatLng(place.lat, place.lng);
        bounds.extend(latlng);

        const marker = new window.naver.maps.Marker({
          position: latlng,
          map: mapInstance.current,
          icon: {
            content: `
              <div style="
                background:${color};
                width:28px;
                height:28px;
                border-radius:50%;
                display:flex;
                align-items:center;
                justify-content:center;
                color:white;
                font-size:14px;
                font-weight:700;
                border:2px solid white;
              ">
                ${markerNumber}
              </div>
            `,
            anchor: new window.naver.maps.Point(14, 14),
          },
        });

        const info = new window.naver.maps.InfoWindow({
          content: `<div style="padding:8px;font-size:14px;">📍 ${place.name}</div>`,
        });

        // 🔥 마커 클릭 시: 인포윈도우 + 일정표 강조 콜백 둘 다 실행
        window.naver.maps.Event.addListener(marker, "click", () => {
          info.open(mapInstance.current, marker);
          if (onSelectPlace) {
            onSelectPlace(dayIndex, placeIndex);
          }
        });

        markersRef.current.push(marker);
        markerNumber++;
        path.push(latlng);
      });

      if (path.length > 1) {
        const polyline = new window.naver.maps.Polyline({
          map: mapInstance.current,
          path,
          strokeColor: color,
          strokeOpacity: 0.9,
          strokeWeight: 4,
        });
        polylinesRef.current.push(polyline);
      }
    });

    // ⭐ 자동 줌
    mapInstance.current.fitBounds(bounds);
  };

  return (
    <div>
      {/* ⭐ 날짜 필터 버튼 UI */}
      <div style={{ marginBottom: "8px", display: "flex", gap: "6px" }}>
        <button
          onClick={() => setSelectedDay("ALL")}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            background: selectedDay === "ALL" ? "#222" : "white",
            color: selectedDay === "ALL" ? "white" : "#222",
            cursor: "pointer",
          }}
        >
          전체
        </button>

        {aiPlan.map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i + 1)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: selectedDay === i + 1 ? dayColors[i] : "white",
              color: selectedDay === i + 1 ? "white" : "#222",
              cursor: "pointer",
            }}
          >
            {i + 1}일차
          </button>
        ))}
      </div>

      {/* 지도 */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "500px",
          borderRadius: "10px",
          border: "2px solid black",
        }}
      ></div>
    </div>
  );
};

export default MapWithPlan;
