import React from "react";
import "../../styles/page/city/SearchBar.css";

export default function SearchBar({ onKeywordChange }) {
  return (
    <div className="city-search-wrap">
      <input
        placeholder="어디든지"
        onChange={(e) => onKeywordChange(e.target.value)}
      />
    </div>
  );
}