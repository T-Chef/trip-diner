import React, { useState, useEffect, useRef } from "react";
import "../../../styles/side/city/SearchBar.css";

export default function SearchBar({ onKeywordChange }) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!onKeywordChange) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 입력값이 없으면 바로 초기화
    if (text === "") {
      setIsDebouncing(false);
      onKeywordChange("");
      timerRef.current = null;
      return;
    }

    setIsDebouncing(true);

    timerRef.current = setTimeout(() => {
      onKeywordChange(text);
      setIsDebouncing(false);
      timerRef.current = null;
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [text, onKeywordChange]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      setIsDebouncing(false);
      onKeywordChange(text);
    }
  };

  const handleClear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setText("");
    setIsDebouncing(false);
    onKeywordChange("");
  };

  return (
    <div className={`city-search-wrap ${isFocused ? "focused" : ""}`}>
      <span className="city-search-icon" aria-hidden="true">
        🔍
      </span>

      <input
        className="city-search-input"
        placeholder="어디든지 검색해 보세요"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <div className="city-search-right">
        {isDebouncing && (
          <span className="search-debounce-dot" aria-hidden="true" />
        )}

        {text && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            aria-label="검색어 지우기"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
