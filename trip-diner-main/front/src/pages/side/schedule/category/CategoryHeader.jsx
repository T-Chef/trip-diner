const CategoryHeader = ({ step }) => {
  return (
    <div className="category-header">
      <span>AI 여행 추천</span>
      <div className="step-indicator">
        {["01", "02", "03", "04", "05"].map((s, i) => (
          <div key={i} className={`step-circle ${step === i + 1 ? "active" : ""}`}>
            {s}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryHeader;
