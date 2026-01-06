// back/services/tour/tourClient.js
import fetch from "node-fetch";
import { blockQuota } from "./quotaGuard.js";

const TOUR_API_KEY = process.env.TOUR_API_KEY || "";

// 응답 본문에 quota 문구가 섞여 오는 케이스 대비
export const hasQuotaMessage = (raw) =>
  typeof raw === "string" &&
  (raw.includes("API token quota exceeded") ||
    raw.includes("quota") ||
    raw.includes("Quota"));

// ✅ serviceKey 이중 인코딩 방지
export function buildTourUrl(baseUrl, paramsObj = {}) {
  const params = new URLSearchParams(paramsObj);
  params.delete("serviceKey");

  const key =
    TOUR_API_KEY.includes("%") ? TOUR_API_KEY : encodeURIComponent(TOUR_API_KEY);

  const qs = params.toString();
  return `${baseUrl}?serviceKey=${key}${qs ? `&${qs}` : ""}`;
}

/**
 * ✅ TourAPI fetch
 * - HTTP 상태코드(res.ok) 체크
 * - quota 문구 감지 시 quota block
 * - JSON 파싱 실패(HTML/빈 응답 등)도 코드화
 * - header.resultCode 비정상도 코드화
 */
export async function fetchTourJson(url, { quotaBlockMs = 60 * 1000 } = {}) {
  let res;
  let raw = "";

  try {
    res = await fetch(url, {
      method: "GET",
      // 너무 오래 걸리면 프론트에서 “튕김” 체감 커져서 타임아웃 권장
      // node-fetch v2에서는 AbortController 사용 가능
    });
    raw = await res.text();
  } catch (e) {
    const err = new Error("TOUR_API_NETWORK_FAILED");
    err.code = "TOUR_API_NETWORK_FAILED";
    err.cause = e;
    throw err;
  }

  // ✅ quota 문구가 오면 어떤 상태코드든 quota 처리
  if (hasQuotaMessage(raw)) {
    blockQuota(quotaBlockMs);
    const err = new Error("TOUR_API_QUOTA_EXCEEDED");
    err.code = "TOUR_API_QUOTA_EXCEEDED";
    err.raw = raw;
    err.status = 429; // 의미상 429
    throw err;
  }

  // ✅ HTTP 자체가 실패(404/500 등)면 먼저 잡아주기
  if (!res.ok) {
    const err = new Error("TOUR_API_HTTP_ERROR");
    err.code = "TOUR_API_HTTP_ERROR";
    err.status = res.status;
    err.statusText = res.statusText;
    err.raw = raw;
    throw err;
  }

  // ✅ JSON 파싱
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    const err = new Error("TOUR_API_PARSE_FAILED");
    err.code = "TOUR_API_PARSE_FAILED";
    err.raw = raw;
    err.status = 502;
    throw err;
  }

  // ✅ TourAPI header 검증
  const header = json?.response?.header;
  if (header?.resultCode && header.resultCode !== "0000") {
    // resultMsg에 quota 느낌이 있을 때도 quota 처리(케이스 방어)
    if (hasQuotaMessage(header?.resultMsg || "")) {
      blockQuota(quotaBlockMs);
      const err = new Error("TOUR_API_QUOTA_EXCEEDED");
      err.code = "TOUR_API_QUOTA_EXCEEDED";
      err.resultCode = header.resultCode;
      err.resultMsg = header.resultMsg;
      err.status = 429;
      throw err;
    }

    const err = new Error("TOUR_API_ERROR");
    err.code = "TOUR_API_ERROR";
    err.resultCode = header.resultCode;
    err.resultMsg = header.resultMsg;
    err.status = 502;
    throw err;
  }

  return json;
}
