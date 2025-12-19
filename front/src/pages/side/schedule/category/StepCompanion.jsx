import React from "react";
import { motion } from "framer-motion";

const companionList = ["혼자", "친구", "연인", "가족"];

const StepCompanion = ({ selectedCompanion, setSelectedCompanion, goNext, goPrev }) => {
  return (
    <motion.div className="step-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2>누구와 함께 떠나시나요?</h2>

      <div className="circle-grid">
        {companionList.map((c) => (
          <button
            key={c}
            className={`circle-btn ${selectedCompanion === c ? "active" : ""}`}
            onClick={() => setSelectedCompanion(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="btn-row">
        <button onClick={goPrev}>이전</button>
        {!!selectedCompanion && <button onClick={goNext}>다음</button>}
      </div>
    </motion.div>
  );
};

export default StepCompanion;
