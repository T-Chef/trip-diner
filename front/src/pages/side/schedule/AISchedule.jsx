import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api";

export default function Schedule({ user }) {
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [days, setDays] = useState(null);
  const [peopleType, setPeopleType] = useState(null);
  const [themes] = useState(["먹방", "힐링"]);
  const [contentTypeIds] = useState([12, 39]);

  const [loading, setLoading] = useState(false);

  // 도시 목록
  useEffect(() => {
    axios.get(`${API_BASE}/tour/cities`).then((res) => setCities(res.data));
  }, []);

  // 구/군 목록
  useEffect(() => {
    if (!selectedCity) return;
    axios
      .get(`${API_BASE}/tour/areas`, {
        params: { areaCode: selectedCity.areaCode },
      })
      .then((res) => setDistricts(res.data));
  }, [selectedCity]);

  const handleGeneratePlan = async () => {
    if (!selectedCity) return alert("도시를 선택해주세요.");
    if (!selectedDistrict) return alert("구/군을 선택해주세요.");
    if (!days) return alert("여행 일수를 선택해주세요.");
    if (!peopleType) return alert("동행 유형을 선택해주세요.");

    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/ai/plan`, {
        userId: user?.id || 1,
        cityName: selectedCity.name,
        areaCode: selectedCity.areaCode,
        districtName: selectedDistrict?.name || null,
        sigunguCode: selectedDistrict?.sigunguCode || null,
        days,
        peopleType,
        themes,
        contentTypeIds,
      });

      navigate("/trip/result", {
        state: { aiPlan: res.data.aiPlan },
      });
    } catch (e) {
      console.error(e);
      alert("AI 일정 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trip-planner">
      <h2>AI 여행 일정 만들기</h2>

      <div className="controls">
        <select
          value={selectedCity ? selectedCity.areaCode : ""}
          onChange={(e) => {
            const code = Number(e.target.value);
            const c = cities.find((city) => city.areaCode === code);
            setSelectedCity(c || null);
            setSelectedDistrict(null);
          }}
        >
          <option value="">도시 선택</option>
          {cities.map((c) => (
            <option key={c.areaCode} value={c.areaCode}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDistrict ? selectedDistrict.sigunguCode : ""}
          onChange={(e) => {
            const code = e.target.value;
            const d = districts.find((x) => x.sigunguCode.toString() === code);
            setSelectedDistrict(d || null);
          }}
          disabled={!districts.length}
        >
          <option value="">구/군 선택</option>
          {districts.map((d) => (
            <option key={d.sigunguCode} value={d.sigunguCode.toString()}>
              {d.name}
            </option>
          ))}
        </select>

        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value="">일수 선택</option>
          <option value={2}>1박2일</option>
          <option value={3}>2박3일</option>
          <option value={4}>3박4일</option>
          <option value={5}>4박5일</option>
        </select>

        <select
          value={peopleType}
          onChange={(e) => setPeopleType(e.target.value)}
        >
          <option value="">동행 선택</option>
          <option>혼자</option>
          <option>친구랑</option>
          <option>연인이랑</option>
          <option>가족이랑</option>
        </select>

        <button
          onClick={handleGeneratePlan}
          disabled={
            loading ||
            !selectedCity ||
            !selectedDistrict ||
            !days ||
            !peopleType
          }
        >
          {loading ? "생성 중..." : "AI 여행 계획 만들기"}
        </button>
      </div>
    </div>
  );
}
