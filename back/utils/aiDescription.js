// back/utils/aiDescription.js
import OpenAI from "openai";
import "dotenv/config";

// ✅ 모듈 스코프 싱글톤
let client = null;

// ✅ 간단 캐시 (같은 title/address는 반복 호출 방지)
const DESC_CACHE = new Map(); // key -> { value, exp }
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

const cleanText = (text) => String(text ?? "").replace(/\s+/g, " ").trim();

function getClient() {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing");

  client = new OpenAI({ apiKey });
  return client;
}

function cacheKey(title, address) {
  return `${cleanText(title)}||${cleanText(address)}`;
}

function getCached(key) {
  const hit = DESC_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    DESC_CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function setCached(key, value) {
  DESC_CACHE.set(key, { value, exp: Date.now() + TTL_MS });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** ✅ OpenAI SDK 에러 형태가 들쭉날쭉이라 최대한 안전하게 뽑기 */
function pickErrMeta(err) {
  const status =
    err?.status ??
    err?.statusCode ??
    err?.response?.status ??
    err?.cause?.status ??
    null;

  const code =
    err?.code ??
    err?.error?.code ??
    err?.response?.data?.error?.code ??
    null;

  const type =
    err?.type ??
    err?.error?.type ??
    err?.response?.data?.error?.type ??
    null;

  const message =
    err?.message ??
    err?.error?.message ??
    err?.response?.data?.error?.message ??
    String(err);

  const requestId =
    err?.request_id ??
    err?.response?.headers?.["x-request-id"] ??
    err?.headers?.["x-request-id"] ??
    null;

  return { status, code, type, requestId, message };
}

function isRetryable({ status, code, message }) {
  // 429 / 5xx
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;

  // 타임아웃/네트워크 계열(환경 따라 code가 다름)
  const m = String(message || "").toLowerCase();
  if (code === "ETIMEDOUT" || code === "ECONNRESET") return true;
  if (m.includes("timeout") || m.includes("timed out")) return true;
  if (m.includes("socket hang up")) return true;

  return false;
}

async function withRetry(fn, { retries = 2, baseDelay = 250 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const meta = pickErrMeta(e);

      if (!isRetryable(meta) || i === retries) throw e;

      // 지수 백오프 + 살짝 지터
      const wait = baseDelay * Math.pow(2, i) + Math.floor(Math.random() * 120);
      await sleep(wait);
    }
  }
  throw lastErr;
}

function buildPrompt(title, address) {
  const t = cleanText(title);
  const a = cleanText(address);

  return `
당신은 여행지 설명을 짧고 자연스럽게 요약하는 전문가입니다.

조건:
- 설명은 반드시 한 문장만 작성
- 장소명을 문장에 그대로 넣지 말기
- "~에 위치한" 표현 금지
- 홍보 문구 금지
- 과장 금지

장소 정보: ${t}, ${a}
`.trim();
}

export async function generateDescription(title, address) {
  const t = cleanText(title);
  const a = cleanText(address);

  if (!t) return "";

  const key = cacheKey(t, a);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const prompt = buildPrompt(t, a);

    const completion = await withRetry(
      () =>
        getClient().chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          max_tokens: 70,
        }),
      { retries: 2, baseDelay: 250 }
    );

    const out = cleanText(completion?.choices?.[0]?.message?.content);

    // ✅ 결과가 너무 짧거나 비면 실패 처리(캐시 X)
    if (!out || out.length < 6) return "";

    setCached(key, out);
    return out;
  } catch (err) {
    const meta = pickErrMeta(err);
    console.error("[AI_DESC_ERROR]", {
      title: t,
      status: meta.status,
      code: meta.code,
      type: meta.type,
      requestId: meta.requestId,
      message: meta.message,
    });
    return "";
  }
}
