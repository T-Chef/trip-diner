import React, { useState, useEffect } from "react";
import "../../styles/page/city/SearchBar.css";

export default function SearchBar({ onKeywordChange }) {
  const [text, setText] = useState("");

  /* -------------------------------------------------------
     🔥 1) 입력 시 300ms 디바운스 적용
  ------------------------------------------------------- */
  useEffect(() => {
    const delay = setTimeout(() => {
      onKeywordChange(text);
    }, 300);

    return () => clearTimeout(delay);
  }, [text, onKeywordChange]);

  /* -------------------------------------------------------
     🔥 2) Enter 누르면 즉시 검색
  ------------------------------------------------------- */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onKeywordChange(text);  // 디바운스 무시하고 즉시 실행
    }
  };

  return (
    <div className="city-search-wrap">
      <input
        placeholder="어디든지"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
