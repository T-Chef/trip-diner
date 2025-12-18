import React, { useState, useEffect, useRef } from "react";
import "../../styles/page/city/SearchBar.css";

export default function SearchBar({ onKeywordChange }) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timerRef = useRef(null);

  /* -------------------------------------------------------
     🔥 1) 입력 시 300ms 디바운스  + 인데케이터
  ------------------------------------------------------- */
  useEffect(() => {
    if (!onKeywordChange) return;

    // 이전 타이머 클리어
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

    // 언마운트/변경 시 타이머 정리
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

  }, [text, onKeywordChange]);

  /* -------------------------------------------------------
     🔥 2) Enter 누르면 즉시 검색
  ------------------------------------------------------- */
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

   /* -------------------------------------------------------
     🔥 3) X 버튼으로 입력값 지우기
  ------------------------------------------------------- */
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
      {/* 오른쪽 영역: 디바운스 점 + 클리어 버튼 */}
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
