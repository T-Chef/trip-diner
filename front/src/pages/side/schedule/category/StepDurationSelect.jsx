import React from "react";
import { motion } from "framer-motion";

const durations = [
  { label: "당일여행", value: 1 },
  { label: "1박 2일", value: 2 },
  { label: "2박 3일", value: 3 },
  { label: "3박 4일", value: 4 },
];

const StepDurationSelect = ({ selectedDays, setSelectedDays, goNext, goPrev }) => {
  return (
    <motion.div className="step-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2>여행 기간을 선택해 주세요.</h2>

      <div className="circle-grid">
        {durations.map((d) => (
          <button
            key={d.value}
            className={`circle-btn ${selectedDays === d.value ? "active" : ""}`}
            onClick={() => setSelectedDays(d.value)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="btn-row">
        <button onClick={goPrev}>이전</button>
        {!!selectedDays && <button onClick={goNext}>다음</button>}
      </div>
    </motion.div>
  );
};

export default StepDurationSelect;
