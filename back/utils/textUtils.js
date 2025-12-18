// back/utils/textUtils.js

// 줄바꿈 제거 + 트림
export const cleanText = (t) => t?.replace(/\n/g, " ").trim() ?? "";

// HTML 제거 + 기본 처리
export const cleanOverview = (text) => {
  if (!text || typeof text !== "string") return "";
  const cleaned = text.replace(/<[^>]+>/g, "").trim();
  return cleaned.length === 0 ? "" : cleaned;
};

// 네이버 category → 태그 배열
export function buildTagsFromCategory(category, contentTypeId) {
  const tags = [];

  if (category) {
    const parts = category
      .split(/[>\/,]/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const part of parts) {
      if (part.includes("카페")) tags.push("카페");
      else if (part.includes("디저트") || part.includes("빵") || part.includes("베이커리"))
        tags.push("베이커리");
      else if (part.includes("한식")) tags.push("한식");
      else if (part.includes("양식")) tags.push("양식");
      else if (part.includes("중식")) tags.push("중식");
      else if (part.includes("일식")) tags.push("일식");
      else if (!tags.includes(part)) tags.push(part);
    }
  }

  if (tags.length === 0 && contentTypeId) {
    const type = String(contentTypeId);
    if (type === "39") tags.push("음식점");
    else if (type === "12") tags.push("관광지");
    else if (type === "32") tags.push("숙박");
  }

  return [...new Set(tags)].slice(0, 3);
}
