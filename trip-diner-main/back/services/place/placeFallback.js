// back/services/place/placeFallback.js
export function makePlaceDetailFallback({
  contentId,
  contentTypeId,
  title,
  address,
  tel = "",
  tags = [],
  error,
  message,
}) {
  return {
    contentId,
    contentTypeId,
    title: title || "상세 정보를 불러오지 못했습니다.",
    address: address || "",
    tel: tel || "",
    overview: "",
    homepage: "",
    mapX: null,
    mapY: null,
    image: null,
    tags,
    noDetail: true,
    error: error || "DETAIL_FALLBACK",
    message: message || "기본 정보만 표시합니다.",
  };
}
