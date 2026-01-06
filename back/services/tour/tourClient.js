import fetch from "node-fetch";
import { blockQuota } from "./quotaGuard.js";

const TOUR_API_KEY = process.env.TOUR_API_KEY || "";

export const hasQuotaMessage = (raw) =>
  typeof raw === "string" &&
  (raw.includes("API token quota exceeded") ||
    raw.includes("quota") ||
    raw.includes("Quota"));

export function buildTourUrl(baseUrl, paramsObj = {}) {
  const params = new URLSearchParams(paramsObj);
  params.delete("serviceKey");

  const key = TOUR_API_KEY.includes("%")
    ? TOUR_API_KEY
    : encodeURIComponent(TOUR_API_KEY);

  const qs = params.toString();
  return `${baseUrl}?serviceKey=${key}${qs ? `&${qs}` : ""}`;
}

// TourAPI 호출 및 에러처리 일괄 처리
export async function fetchTourJson(url, { quotaBlockMs = 60 * 1000 } = {}) {
  let res;
  let raw = "";

  try {
    res = await fetch(url, {
      method: "GET",
    });
    raw = await res.text();
  } catch (e) {
    const err = new Error("TOUR_API_NETWORK_FAILED");
    err.code = "TOUR_API_NETWORK_FAILED";
    err.cause = e;
    throw err;
  }

  if (hasQuotaMessage(raw)) {
    blockQuota(quotaBlockMs);
    const err = new Error("TOUR_API_QUOTA_EXCEEDED");
    err.code = "TOUR_API_QUOTA_EXCEEDED";
    err.raw = raw;
    err.status = 429; // 의미상 429
    throw err;
  }

  if (!res.ok) {
    const err = new Error("TOUR_API_HTTP_ERROR");
    err.code = "TOUR_API_HTTP_ERROR";
    err.status = res.status;
    err.statusText = res.statusText;
    err.raw = raw;
    throw err;
  }

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

  const header = json?.response?.header;
  if (header?.resultCode && header.resultCode !== "0000") {
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
