// front/src/pages/side/schedule/AISchedule.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/schedule/AISchedule.css";

const API_BASE = "http://localhost:4000/api";

const AISchedule = ({ userId = 1 }) => {
  const navigate = useNavigate();

  // 1~4 단계: 1) 도시 2) 기간 3) 동행 4) 컨셉
  const [step, setStep] = useState(1);

  const [cities, setCities] = useState([]);

  const [selectedCity, setSelectedCity] = useState(null);
  const [days, setDays] = useState(null);
  const [peopleType, setPeopleType] = useState(null);
  const [themes, setThemes] = useState([]);

  // 👉 로딩 상태
  const [loading, setLoading] = useState(false);

  const themeOptions = [
  "먹방",
  "힐링",
  "액티비티",
  "쇼핑",
  "문화",
  "자연",
  "바다",
  "산·자연",
  "실내 여행지",
  "문화·역사",
  "전통시장",
  "카페·디저트",
  "SNS 핫플",
  "축제·공연",
];
  const dayOptions = [
    { text: "당일치기", value: 1 },
    { text: "1박 2일", value: 2 },
    { text: "2박 3일", value: 3 },
    { text: "3박 4일", value: 4 },
    { text: "4박 5일", value: 5 },
  ];

  // 도시 목록 불러오기
  useEffect(() => {
    axios.get(`${API_BASE}/tour/cities`).then((res) => setCities(res.data));
  }, []);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  // 👉 구/군 없이 city 기준으로만 요청
  const handleGeneratePlan = async () => {
    try {
      setLoading(true); // 🔥 로딩 시작

      const res = await axios.post(`${API_BASE}/ai/plan`, {
        userId,
        cityName: selectedCity.name,
        areaCode: selectedCity.areaCode,
        days,
        peopleType,
        themes,
      });
      // 🔥 aiPlan 안에 부가 정보 심어서 보내기
const enrichedPlan = {
  ...res.data.aiPlan,
  cityName: selectedCity.name,
  peopleType,
  themes,          // ✅ 여기!
  daysCount: days, // 요약 카드에서 쓰면 편함
};

      navigate("/trip/result", {
        state: {
          aiPlan: enrichedPlan,
          meta: {
            cityName: selectedCity.name,
            days,
            peopleType,
            themes,
            },
        },
      });
    } catch (e) {
      console.error(e);
      alert("AI 일정 생성에 실패했습니다 😢");
    } finally {
      // 결과 페이지로 넘어가도 혹시 모를 상황 대비해서 정리
      setLoading(false);
    }
  };

  // 단계별 필수 선택 체크
  const canNext = () => {
    if (step === 1) return !!selectedCity;
    if (step === 2) return !!days;
    if (step === 3) return !!peopleType;
    if (step === 4) return themes.length >= 2 && themes.length <= 6;
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
                  onClick={() => setSelectedCity(city)}
                  disabled={loading}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP2: 여행 일수 */}
        {step === 2 && (
          <>
            <h2>여행 기간을 선택하세요</h2>
            <div className="btn-grid">
              {dayOptions.map((d) => (
                <button
                  key={d.value}
                  className={days === d.value ? "active" : ""}
                  onClick={() => setDays(d.value)}
                  disabled={loading}
                >
                  {d.text}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP3: 동행 */}
        {step === 3 && (
          <>
            <h2>누구와 떠나나요?</h2>
            <div className="btn-grid">
              {["혼자", "친구랑", "연인이랑", "가족이랑"].map((p) => (
                <button
                  key={p}
                  className={peopleType === p ? "active" : ""}
                  onClick={() => setPeopleType(p)}
                  disabled={loading}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        {/* STEP4: 테마(컨셉) */}
        {step === 4 && (
          <>
            <h2>어떤 컨셉이에요? (최소 2개, 최대 6개)</h2>
            <div className="btn-grid">
              {themeOptions.map((theme) => (
                <button
                  key={theme}
                  className={themes.includes(theme) ? "active" : ""}
                  onClick={() =>
  setThemes((prev) => {
    // 이미 선택된 건 해제
    if (prev.includes(theme)) return prev.filter((x) => x !== theme);

    // ✅ 최대 6개 제한
    if (prev.length >= 6) {
      alert("테마는 최대 6개까지 선택할 수 있어요!");
      return prev;
    }

    return [...prev, theme];
  })
}

                  disabled={loading}
                >
                  {theme}
                </button>
              ))}
            </div>

            {/* 🔥 안내 문구 */}
            <p
              style={{
                marginTop: "10px",
                fontSize: "14px",
                color: themes.length < 2 ? "#ff4d4f" : "#999",
                textAlign: "center",
              }}
            >
              최소 <b>2개 이상</b> 선택해주세요 (현재 {themes.length}개)
            </p>
          </>
        )}

        {/* 네비게이션 버튼 */}
        <div className="nav-buttons">
          {step > 1 && (
            <button className="back" onClick={handleBack} disabled={loading}>
              이전
            </button>
          )}

          {step < 4 && (
            <button
              className="next"
              disabled={!canNext() || loading}
              onClick={handleNext}
            >
              다음
            </button>
          )}

          {step === 4 && (
            <button
              className="submit"
              disabled={!canNext() || loading}
              onClick={handleGeneratePlan}
            >
              {loading ? "AI가 메뉴 만드는 중..." : "여행 메뉴 만들기 🍽"}
            </button>
          )}
        </div>
      </div>

      {/* 🔮 로딩 오버레이 */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="loading-icon">🤖</div>
            <h3 className="loading-title">AI 여행 플래너가</h3>
            <h3 className="loading-title">당신만의 여행 코스를 만드는 중...</h3>
            <p className="loading-sub">
              주변 맛집·명소를 분석해서 일정표를 짜고 있어요.
              <br />
              잠시만 기다려 주세요!
            </p>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISchedule;
