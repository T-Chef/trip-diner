// back/services/event/eventUtils.js

export const LOG_EVENT = process.env.DEBUG_EVENT_LOG === "1";


export const stripHtml = (s = "") => String(s).replace(/<[^>]+>/g, "").trim();

export function guessCityName(address = "") {
  const first = String(address).split(" ")[0] || "";
  return first
    .replace("특별시", "")
    .replace("광역시", "")
    .replace("특별자치시", "")
    .replace("특별자치도", "")
    .replace("도", "");
}

export function normalizeKeyword(s = "") {
  return String(s)
    .replace(/<[^>]+>/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function removeCityDup(keyword = "", cityName = "") {
  const k = String(keyword || "").trim();
  const c = String(cityName || "").trim();
  if (!c) return k;
  const re = new RegExp(`^${c}\\s+`, "i");
  return k.replace(re, "").trim();
}

export function pickPlaceHintFromAddress(address = "", cityName = "") {
  const parts = String(address).split(/\s+/).filter(Boolean);
  const hint =
    parts.find((p) =>
      /(해수욕장|공원|광장|대교|시장|역|항|터미널|로|길|동|리)$/u.test(p)
    ) ||
    parts[2] ||
    parts[1] ||
    "";

  const h = normalizeKeyword(hint);
  if (!h) return "";
  return removeCityDup(h, cityName);
}

export function stripEventWords(s = "") {
  return String(s)
    .replace(
      /(드론|라이트쇼|라이트\s*쇼|쇼|공연|행사|축제|페스티벌|festival|event|개막|개최|시즌|투어|기념|콘서트|전시|박람회|마켓|야시장|불꽃|불꽃놀이)/gi,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function buildFallbackOverview({ title, address, category }) {
  const t = stripHtml(title);
  const a = stripHtml(address);
  const c = stripHtml(category);
  if (a && t && c) return `${a}에서 열리는 ${t} (${c}) 행사입니다.`;
  if (a && t) return `${a}에서 열리는 ${t} 행사입니다.`;
  if (t) return `${t} 행사 정보입니다.`;
  return "이벤트 소개 정보가 아직 준비되지 않았습니다.";
}

export function isWeakOverview(overview = "") {
  const s = String(overview || "").trim();
  if (!s) return true;

  const weakSignals = [
    "등록된 소개",
    "overview",
    "호출 한도",
    "상세 정보를",
    "불러오는 중 오류",
    "fallback",
    "준비되지 않았습니다",
  ];
  return weakSignals.some((w) => s.includes(w));
}

export function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

