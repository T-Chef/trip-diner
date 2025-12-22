import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const API_BASE = "/api";

const StepRegionSelect = ({ selectedCity, setSelectedCity, goNext }) => {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/tour/cities`).then((res) => setCities(res.data));
  }, []);

  return (
    <motion.div className="step-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2>여행을 떠나고 싶은 지역을 선택해 주세요.</h2>
      <div className="circle-grid">
        {cities.map((city) => (
          <button
            key={city.areaCode}
            className={`circle-btn ${selectedCity?.areaCode === city.areaCode ? "active" : ""}`}
            onClick={() => {
              setSelectedCity(city);
            }}
          >
            {city.name}
          </button>
        ))}
      </div>
      {!!selectedCity && (
        <button className="next-btn" onClick={goNext}>다음</button>
      )}
    </motion.div>
  );
};

export default StepRegionSelect;
