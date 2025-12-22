import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const API_BASE = "/api";

const StepDistrictSelect = ({
  selectedCity,
  selectedDistrict,
  setSelectedDistrict,
  goNext,
  goPrev,
}) => {
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    if (!selectedCity) return;
    axios
      .get(`${API_BASE}/tour/areas`, { params: { areaCode: selectedCity.areaCode } })
      .then((res) => setDistricts(res.data));
  }, [selectedCity]);

  return (
    <motion.div className="step-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2>{selectedCity.name}에서 어디로 떠날까요?</h2>
      <div className="circle-grid">
        {districts.map((d) => (
          <button
            key={d.sigunguCode}
            className={`circle-btn ${selectedDistrict?.sigunguCode === d.sigunguCode ? "active" : ""}`}
            onClick={() => setSelectedDistrict(d)}
          >
            {d.name}
          </button>
        ))}
      </div>
      <div className="btn-row">
        <button onClick={goPrev}>이전</button>
        {!!selectedDistrict && <button onClick={goNext}>다음</button>}
      </div>
    </motion.div>
  );
};

export default StepDistrictSelect;
