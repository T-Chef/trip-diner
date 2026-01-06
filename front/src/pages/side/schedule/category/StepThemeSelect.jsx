import React from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:4000/api";
const themesList = [
  "산",
  "실내여행지",
  "액티비티",
  "문화·역사",
  "테마파크",
  "카페",
  "전통시장",
  "축제",
];
const MAX_THEMES = 6;

const StepThemeSelect = ({
  selectedThemes,
  setSelectedThemes,
  selectedCity,
  selectedDistrict,
  selectedDays,
  selectedCompanion,
  goPrev,
}) => {
  const navigate = useNavigate();

  const toggleTheme = (theme) => {
    if (selectedThemes.includes(theme)) {
      setSelectedThemes(selectedThemes.filter((t) => t !== theme));
      return;
    }

    if (selectedThemes.length >= MAX_THEMES) {
      alert(`테마는 최대 ${MAX_THEMES}개까지 선택할 수 있어요!`);
      return;
    }

    setSelectedThemes([...selectedThemes, theme]);
  };

  const handleGeneratePlan = async () => {
    if (selectedThemes.length < 2) return alert("2개 이상 선택해주세요!");

    try {
      const res = await axios.post(`${API_BASE}/ai/plan`, {
        cityName: selectedCity.name,
        districtName: selectedDistrict.name,
        areaCode: selectedCity.areaCode,
        sigunguCode: selectedDistrict.sigunguCode,
        days: selectedDays,
        peopleType: selectedCompanion,
        themes: selectedThemes,
        contentTypeIds: [12, 39],
      });

      navigate("/trip/result", { state: { aiPlan: res.data.aiPlan } });
    } catch (err) {
      console.error(err);
      alert("AI 일정 생성 실패!");
    }
  };

  const isMaxed = selectedThemes.length >= MAX_THEMES;

  return (
    <motion.div
      className="step-box"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2>원하는 여행 테마를 선택해주세요! (최소 2개, 최대 {MAX_THEMES}개)</h2>

      <div className="circle-grid">
        {themesList.map((t) => {
          const selected = selectedThemes.includes(t);
          const disabled = isMaxed && !selected;

          return (
            <button
              key={t}
              className={`circle-btn ${selected ? "active" : ""} ${
                disabled ? "disabled" : ""
              }`}
              onClick={() => toggleTheme(t)}
              disabled={disabled}
              type="button"
            >
              {t}
            </button>
          );
        })}
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
