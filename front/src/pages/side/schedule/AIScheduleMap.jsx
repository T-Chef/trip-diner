import React, { useEffect, useRef, useState, useCallback } from "react";

const DAY_COLORS = ["#0078ff", "#1ec800", "#ff3b30", "#ff9500", "#9b59b6"];
const AIScheduleMap = ({
  aiPlan,
  onSelectPlace,
  activePlace,
  selectedDayExternal,
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [selectedDay, setSelectedDay] = useState("ALL");

  useEffect(() => {
    if (!selectedDayExternal) return;
    if (selectedDayExternal === "ALL") setSelectedDay("ALL");
    else setSelectedDay(selectedDayExternal);
  }, [selectedDayExternal]);

  const resizeMap = useCallback(() => {
    if (mapInstance.current && mapRef.current) {
      const mapDiv = mapRef.current;
      mapInstance.current.setSize(
        new window.naver.maps.Size(mapDiv.clientWidth, mapDiv.clientHeight)
      );
    }
  }, []);

  const getFirstPlaceLatLng = useCallback(() => {
    if (!aiPlan?.days) return null;
    for (const day of aiPlan.days) {
      for (const p of day.places || []) {
        if (p.lat && p.lng) return { lat: p.lat, lng: p.lng };
      }
    }
    return null;
  }, [aiPlan]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver || !aiPlan?.days) return;

    if (!mapInstance.current) {
      const first = getFirstPlaceLatLng();
      const centerLatLng = first
        ? new window.naver.maps.LatLng(first.lat, first.lng)
        : new window.naver.maps.LatLng(37.5665, 126.978);

      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        zoom: 11,
        center: centerLatLng,
      });

      window.addEventListener("resize", resizeMap);
    }

    // 기존 마커/폴리라인 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    const bounds = new window.naver.maps.LatLngBounds();
    let hasAnyPoint = false;

    (aiPlan.days || []).forEach((dayPlan, dayIndex) => {
      if (!dayPlan?.places) return;
      if (selectedDay !== "ALL" && Number(selectedDay) !== dayIndex + 1) return;

      const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
      let path = [];
      let markerNumber = 1;

      dayPlan.places.forEach((place, placeIndex) => {
        if (!place.lat || !place.lng) return;

        const latlng = new window.naver.maps.LatLng(place.lat, place.lng);
        bounds.extend(latlng);
        hasAnyPoint = true;

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
              </div>`,
            anchor: new window.naver.maps.Point(14, 14),
          },
        });

        marker.customDayIdx = dayIndex;
        marker.customPlaceIdx = placeIndex;

        window.naver.maps.Event.addListener(marker, "click", () =>
          onSelectPlace?.(dayIndex, placeIndex)
        );

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

    resizeMap();

    if (!activePlace) {
      if (hasAnyPoint) {
        mapInstance.current.fitBounds(bounds);
      } else {
        mapInstance.current.setCenter(
          new window.naver.maps.LatLng(37.5665, 126.978)
        );
        mapInstance.current.setZoom(11);
      }
    }
  }, [aiPlan, selectedDay, onSelectPlace, getFirstPlaceLatLng, resizeMap]);

  useEffect(() => {
    console.log("🧪 지도에 전달된 aiPlan:", aiPlan);

    if (!window.naver) {
      const script = document.createElement("script");
      script.src =
        "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=1o7cfked5o";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapInstance.current) {
        window.removeEventListener("resize", resizeMap);
        markersRef.current.forEach((m) => m.setMap(null));
        polylinesRef.current.forEach((p) => p.setMap(null));
        markersRef.current = [];
        polylinesRef.current = [];
      }
    };
  }, [initMap, resizeMap, aiPlan]);

  useEffect(() => {
    if (!mapInstance.current || !window.naver || !activePlace) return;

    const dayIdx = activePlace.dayIdx ?? activePlace.day;
    const placeIdx = activePlace.placeIdx ?? activePlace.index;

    if (!Number.isInteger(dayIdx) || !Number.isInteger(placeIdx)) return;

    const place = aiPlan?.days?.[dayIdx]?.places?.[placeIdx];
    if (!place?.lat || !place?.lng) return;

    const latlng = new window.naver.maps.LatLng(place.lat, place.lng);

    mapInstance.current.panTo(latlng);
    mapInstance.current.setZoom(14);

    const targetMarker = markersRef.current.find(
      (m) => m.customDay === dayIdx && m.customIndex === placeIdx
    );

    if (targetMarker) {
      targetMarker.setAnimation(window.naver.maps.Animation.BOUNCE);
      setTimeout(() => targetMarker.setAnimation(null), 1200);
    }
  }, [activePlace, aiPlan]);

  console.log("activePlace:", activePlace);
  console.log("markers:", markersRef.current.length);

  return (
    <div
      ref={mapRef}
      className="map-area"
      style={{ width: "100%", height: "100%" }}
    ></div>
  );
};

export default AIScheduleMap;
