import React, { useEffect, useRef, useState, useCallback } from "react";

const AIScheduleMap = ({ aiPlan, onSelectPlace, activePlace }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [selectedDay, setSelectedDay] = useState("ALL");

  const dayColors = ["#0078ff", "#1ec800", "#ff3b30", "#ff9500", "#9b59b6"];

  const resizeMap = () => {
    if (mapInstance.current && mapRef.current) {
      const mapDiv = mapRef.current;
      mapInstance.current.setSize(
        new window.naver.maps.Size(mapDiv.clientWidth, mapDiv.clientHeight)
      );
    }
  };

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.naver) return;

    if (!mapInstance.current) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        zoom: 11,
        center: new window.naver.maps.LatLng(37.5665, 126.9780),
      });

      window.addEventListener("resize", resizeMap);
    }

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!aiPlan || aiPlan.length === 0) return;

    const bounds = new window.naver.maps.LatLngBounds();

    aiPlan.forEach((dayPlan, dayIndex) => {
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
              </div>`,
            anchor: new window.naver.maps.Point(14, 14),
          }
        });

        marker.day = dayIndex;
        marker.index = placeIndex;

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

    mapInstance.current.fitBounds(bounds);
    resizeMap();
  }, [aiPlan, selectedDay, onSelectPlace]);

  const loadMap = useCallback(() => {
    const scriptId = "naver-map-sdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=1o7cfked5o";
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else initMap();
  }, [initMap]);

  useEffect(() => {
    loadMap();

  return () => {
    if (mapInstance.current) {
      window.removeEventListener("resize", resizeMap);
      markersRef.current.forEach((m) => m.setMap(null));
      polylinesRef.current.forEach((p) => p.setMap(null));
      markersRef.current = [];
      polylinesRef.current = [];
    }
  };
}, [aiPlan, selectedDay, loadMap]); // ★ 여기 수정

  useEffect(() => {
    if (!mapInstance.current || !activePlace) return;
    if (!activePlace || activePlace.day === null) return;

    const { day, index } = activePlace;
    const targetMarker = markersRef.current.find(
      (m) => m.day === day && m.index === index
    );
    if (!targetMarker) return;
    mapInstance.current.panTo(targetMarker.getPosition());
    mapInstance.current.setZoom(14);
    window.naver.maps.Event.trigger(targetMarker, "click");
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