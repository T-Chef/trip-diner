import React, { useEffect, useRef, useState, useCallback } from "react";

const DAY_COLORS = ["#0078ff", "#1ec800", "#ff3b30", "#ff9500", "#9b59b6"];

const AIScheduleMap = ({ aiPlan, onSelectPlace, activePlace, selectedDayExternal }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const resizeObserverRef = useRef(null);

  const [selectedDay, setSelectedDay] = useState("ALL");

  useEffect(() => {
    if (!selectedDayExternal) return;
    if (selectedDayExternal === "ALL") setSelectedDay("ALL");
    else setSelectedDay(selectedDayExternal);
  }, [selectedDayExternal]);

  // ✅ 지도 크기 재계산
  const resizeMap = useCallback(() => {
    if (mapInstance.current && mapRef.current && window.naver) {
      const mapDiv = mapRef.current;
      mapInstance.current.setSize(
        new window.naver.maps.Size(mapDiv.clientWidth, mapDiv.clientHeight)
      );
       window.naver.maps.Event.trigger(mapInstance.current, "resize");
    }
  }, []);

  const rafId = useRef(null);

const forceResize = useCallback(() => {
  if (!mapInstance.current || !mapRef.current || !window.naver) return;

  const el = mapRef.current;
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (!w || !h) return;

  mapInstance.current.setSize(new window.naver.maps.Size(w, h));

  // ✅ 네이버지도는 이 트리거가 있어야 타일이 꽉 차는 경우가 많음
  window.naver.maps.Event.trigger(mapInstance.current, "resize");

  // (있으면 도움됨 - 없는 버전도 있으니 optional)
  mapInstance.current.refresh?.();
}, []);

useEffect(() => {
  if (!mapRef.current) return;

  const run = () => {
    // 레이아웃 변경 직후/최대화 직후 타이밍 보정(중요)
    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      forceResize();
      setTimeout(forceResize, 50);
      setTimeout(forceResize, 200);
    });
  };

  // ✅ 창 리사이즈
  window.addEventListener("resize", run);

  // ✅ 최대화/축소에서 더 잘 잡히는 경우가 있어서 같이
  window.visualViewport?.addEventListener("resize", run);

  // ✅ grid/flex 레이아웃 변화 감지
  const ro = new ResizeObserver(run);
  ro.observe(mapRef.current);

  // 최초 1번
  run();

  return () => {
    window.removeEventListener("resize", run);
    window.visualViewport?.removeEventListener("resize", run);
    ro.disconnect();
    cancelAnimationFrame(rafId.current);
  };
}, [forceResize]);

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

    // ✅ 최초 1회만 지도 생성
    if (!mapInstance.current) {
      const first = getFirstPlaceLatLng();
      const centerLatLng = first
        ? new window.naver.maps.LatLng(first.lat, first.lng)
        : new window.naver.maps.LatLng(37.5665, 126.978);

      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        zoom: 11,
        center: centerLatLng,
      });
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
      const path = [];
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

    // ✅ 중요: fitBounds 전에 사이즈 먼저 맞춰주기 (흰 공백 방지)
    requestAnimationFrame(() => {
      forceResize();

      if (!activePlace) {
        if (hasAnyPoint) mapInstance.current.fitBounds(bounds);
        else {
          mapInstance.current.setCenter(new window.naver.maps.LatLng(37.5665, 126.978));
          mapInstance.current.setZoom(11);
        }
      }
    });
 }, [aiPlan, selectedDay, onSelectPlace, activePlace, getFirstPlaceLatLng, forceResize]);

  // ✅ 스크립트 로드는 1번만
  useEffect(() => {
    if (window.naver) return;

    const script = document.createElement("script");
    // TODO: 키는 env로 빼는 걸 추천
    script.src = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=1o7cfked5o";
    script.async = true;
    script.onload = () => initMap();
    document.head.appendChild(script);
  }, []); // 🔥 1번만

  // ✅ aiPlan/selectedDay 바뀔 때마다 다시 그리기
  useEffect(() => {
    if (!window.naver) return;
    initMap();
  }, [initMap]);

  // 🔍 리스트에서 장소 클릭했을 때 해당 마커로 이동
  useEffect(() => {
    if (!mapInstance.current || !activePlace) return;

    const targetMarker = markersRef.current.find(
      (m) => m.customDay === activePlace.day && m.customIndex === activePlace.index
    );
    if (!targetMarker) return;

    mapInstance.current.panTo(targetMarker.getPosition());
    mapInstance.current.setZoom(14);

    targetMarker.setAnimation(window.naver.maps.Animation.BOUNCE);
    setTimeout(() => targetMarker.setAnimation(null), 1200);
  }, [activePlace]);

  // ✅ 언마운트 시 마커/라인 정리
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      polylinesRef.current.forEach((p) => p.setMap(null));
      markersRef.current = [];
      polylinesRef.current = [];
    };
  }, []);

 return <div ref={mapRef} className="naver-map" />;

};

export default AIScheduleMap;
