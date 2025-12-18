// front/src/components/city/PlaceDetailMap.jsx
import React, { useEffect, useRef } from "react";

export default function PlaceDetailMap({ lat, lng, title }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng) return; // 좌표 없으면 지도 생성 안 함

    const initMap = () => {
      if (!window.naver || !mapRef.current) return;

      const center = new window.naver.maps.LatLng(lat, lng);

      const map = new window.naver.maps.Map(mapRef.current, {
        center,
        zoom: 15,
      });

      new window.naver.maps.Marker({
        position: center,
        map,
        title,
      });
    };

    if (!window.naver) {
      const script = document.createElement("script");
      script.src =
        "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=1o7cfked5o"; // 👉 네이버 지도 키로 교체
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [lat, lng, title]);

  // 좌표 없는 경우: 안내 문구
  if (!lat || !lng) {
    return (
      <div className="pd-map pd-map-empty">
        위치 좌표 정보가 없어 지도를 표시할 수 없어요 🙏
      </div>
    );
  }

  return <div ref={mapRef} className="pd-map" />;
}
