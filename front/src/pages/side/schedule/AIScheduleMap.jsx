import React, { useEffect, useRef, useState, useCallback } from "react";

const DAY_COLORS = ["#0078ff", "#1ec800", "#ff3b30", "#ff9500", "#9b59b6"];
const AIScheduleMap = ({ aiPlan, onSelectPlace, activePlace, selectedDayExternal }) => {
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

  // ✅ resizeMap: useCallback으로 고정 (이벤트리스너 add/remove 정확히 동일 참조)
  const resizeMap = useCallback(() => {
    if (mapInstance.current && mapRef.current) {
      const mapDiv = mapRef.current;
      mapInstance.current.setSize(
        new window.naver.maps.Size(mapDiv.clientWidth, mapDiv.clientHeight)
      );
    }
  }, []);

  // ✅ 첫 장소 좌표: useCallback으로 고정 (aiPlan 변경될 때만 변경)
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
        : new window.naver.maps.LatLng(37.5665, 126.9780);

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
      if (selectedDay !== "ALL" && selectedDay !== dayIndex + 1) return;

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

        marker.customDay = dayIndex;
        marker.customIndex = placeIndex;

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

    // ✅ activePlace 썼으니 deps에도 포함해야 함
    if (!activePlace) {
      if (hasAnyPoint) {
        mapInstance.current.fitBounds(bounds);
      } else {
        mapInstance.current.setCenter(new window.naver.maps.LatLng(37.5665, 126.9780));
        mapInstance.current.setZoom(11);
      }
    }
  }, [aiPlan, selectedDay, onSelectPlace, activePlace, getFirstPlaceLatLng, resizeMap]);


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

  // 🔍 리스트에서 장소 클릭했을 때 해당 마커로 이동
  useEffect(() => {
    if (!mapInstance.current || !activePlace) return;

    const targetMarker = markersRef.current.find(
      (m) =>
        m.customDay === activePlace.day && m.customIndex === activePlace.index
    );
    if (!targetMarker) return;

    mapInstance.current.panTo(targetMarker.getPosition());
    mapInstance.current.setZoom(14);

    targetMarker.setAnimation(window.naver.maps.Animation.BOUNCE);
    setTimeout(() => targetMarker.setAnimation(null), 1200);
  }, [activePlace]);

  return (
    <div
      ref={mapRef}
      className="map-area"
      style={{ width: "100%", height: "100%" }}
    ></div>
  );
};

export default AIScheduleMap;
