// back/services/tour/tourClient.js
import fetch from "node-fetch";
import { blockQuota } from "./quotaGuard.js";

const TOUR_API_KEY = process.env.TOUR_API_KEY || "";

export const hasQuotaMessage = (raw) =>
  typeof raw === "string" && raw.includes("API token quota exceeded");

// ✅ serviceKey 이중 인코딩 방지
export function buildTourUrl(baseUrl, paramsObj = {}) {
  const params = new URLSearchParams(paramsObj);
  params.delete("serviceKey");

  const key =
    TOUR_API_KEY.includes("%") ? TOUR_API_KEY : encodeURIComponent(TOUR_API_KEY);

  const qs = params.toString();
  return `${baseUrl}?serviceKey=${key}${qs ? `&${qs}` : ""}`;
}

export async function fetchTourJson(url, { quotaBlockMs = 60 * 1000 } = {}) {
  const res = await fetch(url);
  const raw = await res.text();

  if (hasQuotaMessage(raw)) {
    blockQuota(quotaBlockMs);
    const err = new Error("TOUR_API_QUOTA_EXCEEDED");
    err.code = "TOUR_API_QUOTA_EXCEEDED";
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
    throw err;
  }

  const header = json?.response?.header;
  if (header?.resultCode && header.resultCode !== "0000") {
    const err = new Error("TOUR_API_ERROR");
    err.code = "TOUR_API_ERROR";
    err.resultCode = header.resultCode;
    err.resultMsg = header.resultMsg;
    throw err;
  }

  return json;
}
