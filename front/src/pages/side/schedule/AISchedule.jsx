import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/schedule/AISchedule.css";

const API_BASE = "http://localhost:4000/api";

const AISchedule = ({ userId = 1 }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [days, setDays] = useState(null);
  const [peopleType, setPeopleType] = useState(null);
  const [themes, setThemes] = useState([]);

  const themeOptions = ["먹방", "힐링", "액티비티", "쇼핑", "문화", "자연"];
  const dayOptions = [
    { text: "당일치기", value: 1 },
    { text: "1박 2일", value: 2 },
    { text: "2박 3일", value: 3 },
    { text: "3박 4일", value: 4 },
    { text: "4박 5일", value: 5 },
  ];

  useEffect(() => {
    axios.get(`${API_BASE}/tour/cities`).then((res) => setCities(res.data));
  }, []);

  useEffect(() => {
    if (!selectedCity) return;
    axios
      .get(`${API_BASE}/tour/areas`, {
        params: { areaCode: selectedCity.areaCode },
      })
      .then((res) => setDistricts(res.data));
  }, [selectedCity]);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleGeneratePlan = async () => {
    try {
      const res = await axios.post(`${API_BASE}/ai/plan`, {
        userId,
        cityName: selectedCity.name,
        areaCode: selectedCity.areaCode,
        districtName: selectedDistrict?.name,
        sigunguCode: selectedDistrict?.sigunguCode,
        days,
        peopleType,
        themes,
      });

      navigate("/trip/result", { state: { aiPlan: res.data.aiPlan } });
    } catch (e) {
      alert("AI 일정 생성에 실패했습니다 😢");
      console.error(e);
    }
  };

  const canNext = () => {
    if (step === 1) return !!selectedCity;
    if (step === 2) return !!selectedDistrict;
    if (step === 3) return !!days;
    if (step === 4) return !!peopleType;
    if (step === 5) return themes.length > 0;
    return false;
  };

  return (
    <div className="trip-wrapper">
      <div className="trip-card">
        {/* 단계 표시 */}
        <div className="step-indicator">{String(step).padStart(2, "0")}</div>

        {/* STEP1: 도시 선택 */}
        {step === 1 && (
          <>
            <h2>어디로 떠나세요?</h2>
            <div className="btn-grid">
              {cities.map((city) => (
                <button
                  key={city.areaCode}
                  className={
                    selectedCity?.areaCode === city.areaCode ? "active" : ""
                  }
                  onClick={() => {
                    setSelectedCity(city);
                    setSelectedDistrict(null);
                  }}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP2: 지역 선택 */}
        {step === 2 && (
          <>
            <h2>어느 지역으로 가요?</h2>
            <div className="btn-grid">
              {districts.map((d) => (
                <button
                  key={d.sigunguCode}
                  className={
                    selectedDistrict?.sigunguCode === d.sigunguCode
                      ? "active"
                      : ""
                  }
                  onClick={() => setSelectedDistrict(d)}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP3: 여행 일수 */}
        {step === 3 && (
          <>
            <h2>여행 기간을 선택하세요</h2>
            <div className="btn-grid">
              {dayOptions.map((d) => (
                <button
                  key={d.value}
                  className={days === d.value ? "active" : ""}
                  onClick={() => setDays(d.value)}
                >
                  {d.text}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP4: 동행 */}
        {step === 4 && (
          <>
            <h2>누구와 떠나나요?</h2>
            <div className="btn-grid">
              {["혼자", "친구랑", "연인이랑", "가족이랑"].map((p) => (
                <button
                  key={p}
                  className={peopleType === p ? "active" : ""}
                  onClick={() => setPeopleType(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP5: 테마 */}
        {step === 5 && (
          <>
            <h2>어떤 컨셉이에요?</h2>
            <div className="btn-grid">
              {themeOptions.map((theme) => (
                <button
                  key={theme}
                  className={themes.includes(theme) ? "active" : ""}
                  onClick={() =>
                    setThemes((prev) =>
                      prev.includes(theme)
                        ? prev.filter((x) => x !== theme)
                        : [...prev, theme]
                    )
                  }
                >
                  {theme}
                </button>
              ))}
            </div>
          </>
        )}

        {/* 네비게이션 버튼 */}
        <div className="nav-buttons">
          {step > 1 && (
            <button className="back" onClick={handleBack}>
              이전
            </button>
          )}

          {step < 5 && (
            <button className="next" disabled={!canNext()} onClick={handleNext}>
              다음
            </button>
          )}

          {step === 5 && (
            <button
              className="submit"
              disabled={!canNext()}
              onClick={handleGeneratePlan}
            >
              여행 메뉴 만들기 🍽
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISchedule;
