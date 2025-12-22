import React from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";
const themesList = ["산", "실내여행지", "액티비티", "문화·역사", "테마파크", "카페", "전통시장", "축제"];

const StepThemeSelect = ({
  selectedThemes,
  setSelectedThemes,
  selectedCity,
  selectedDistrict,
  selectedDays,
  selectedCompanion,
  goPrev
}) => {
  const navigate = useNavigate();

  const toggleTheme = (theme) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter((t) => t !== theme));
    } else if (selectedThemes.length < 4) {
      setSelectedThemes([...selectedThemes, theme]);
    }
  };

  const handleGeneratePlan = async () => {
    if (selectedThemes.length < 2)
      return alert("2개 이상 선택해주세요!");

    try {
      const res = await axios.post(`${API_BASE}/ai/plan`, {
        cityName: selectedCity.name,
        districtName: selectedDistrict.name,
        areaCode: selectedCity.areaCode,
        sigunguCode: selectedDistrict.sigunguCode,
        days: selectedDays,
        peopleType: selectedCompanion,
        themes: selectedThemes,
        contentTypeIds: [12, 39], // 관광지+음식점 (임시)
      });

      navigate("/trip/result", { state: { aiPlan: res.data.aiPlan } });
    } catch (err) {
      console.error(err);
      alert("AI 일정 생성 실패!");
    }
  };

  return (
    <motion.div className="step-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2>원하는 여행 테마를 선택해주세요! (최소 2개, 최대 4개)</h2>

      <div className="circle-grid">
        {themesList.map((t) => (
          <button
            key={t}
            className={`circle-btn ${selectedThemes.includes(t) ? "active" : ""}`}
            onClick={() => toggleTheme(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="btn-row">
        <button onClick={goPrev}>이전</button>
        <button className="next-btn" onClick={handleGeneratePlan}>
          완료
        </button>
      </div>
    </motion.div>
  );
};

export default StepThemeSelect;
