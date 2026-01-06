import { load } from "cheerio";
import fetch from "node-fetch";

import { getCache, setCache } from "../../utils/cache.js";
import { dedup } from "../../utils/inflight.js";
import {
  LOG_EVENT,
  guessCityName,
  normalizeKeyword,
  stripHtml,
} from "./eventUtils.js";

async function searchWebNaver(query) {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret) return [];

  const url = `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(
    query
  )}&display=5&sort=sim`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": id,
      "X-Naver-Client-Secret": secret,
    },
  });

  const text = await res.text();
  if (!text.startsWith("{")) return [];

  const data = JSON.parse(text);
  return Array.isArray(data.items) ? data.items : [];
}

function cleanScrapedText(raw = "") {
  const s = String(raw || "");

  const lines = s
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const dropContains = [
    "SNS 공유",
    "페이스북",
    "트위터",
    "카카오톡",
    "주소 복사",
    "점자",
    "화면 프린트",
    "스크랩",
    "document.addEventListener",
    "onload = function",
    "window.print",
    "$(",
    "var ",
    "function(",
    "eval(",
    "try {",
    "catch(",
  ];

  const filtered = lines.filter((l) => {
    if (l.length <= 1) return false;
    if (dropContains.some((w) => l.includes(w))) return false;
    if (
      /[{};=<>]/.test(l) &&
      /function|document|window|\$\(|var|const|let/.test(l)
    )
      return false;
    return true;
  });

  let out = filtered.join("\n").trim();
  if (out.length > 1200) out = out.slice(0, 1200) + "…";
  return out;
}

async function scrapeMainText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
  });

  const html = await res.text();
  const $ = load(html);

  $("script, style, noscript").remove();

  // OneEye 특별 처리
  if (/culture\.go\.kr\/oneeye\/oneEyeView\.do/i.test(url)) {
    const t =
      $("#charactersChange").text().trim() ||
      $(".view_cont").text().trim() ||
      $("article").text().trim();

    const cleaned = cleanScrapedText(t);
    if (cleaned && cleaned.length >= 30) return cleaned;
  }

  const candidates = [
    "article",
    "#content",
    ".content",
    ".contents",
    ".sub_contents",
    ".board_view",
    ".view",
    ".view_cont",
    ".view_con",
    ".board-view",
    ".post",
    "main",
  ];

  let bestText = "";
  for (const sel of candidates) {
    const t = $(sel)
      .text()
      .replace(/[ \t]+/g, " ")
      .trim();
    if (t.length > bestText.length) bestText = t;
  }

  if (!bestText)
    bestText = $("body")
      .text()
      .replace(/[ \t]+/g, " ")
      .trim();

  return cleanScrapedText(bestText);
}

function pickBestWebItem(items, { title = "", city = "" }) {
  const t = normalizeKeyword(title);
  const c = normalizeKeyword(city);

  let best = null;
  let bestScore = -1;

  for (const it of items || []) {
    const link = String(it.link || "");
    const itTitle = normalizeKeyword(it.title || "");
    const desc = normalizeKeyword(it.description || "");

    let score = 0;

    // 도메인 가중치
    if (/culture\.go\.kr/i.test(link)) score += 60;
    if (/visitbusan\.net/i.test(link)) score += 50;
    if (/\.go\.kr/i.test(link)) score += 30;

    // 제목/설명 매칭
    if (t && (itTitle.includes(t) || t.includes(itTitle))) score += 25;
    if (t && desc.includes(t)) score += 10;
    if (c && (itTitle.includes(c) || desc.includes(c))) score += 8;

    // 행사/축제 키워드
    if (/축제|행사|페스티벌|festival|event/i.test(itTitle + " " + desc))
      score += 10;

    if (score > bestScore) {
      bestScore = score;
      best = { ...it, _score: score };
    }
  }

  return best;
}

export async function getOfficialOverview({ title, address }) {
  const safeTitle = String(title || "").trim();
  const safeAddr = String(address || "").trim();
  if (!safeTitle && safeAddr.length < 2) return null;

  const city = guessCityName(safeAddr);
  const q = `${safeTitle} ${city} 축제 안내`.trim();

  const cacheKey = `event|official|${q}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const { p } = dedup(cacheKey, async () => {
    const items = await searchWebNaver(q);
    const best = pickBestWebItem(items, { title: safeTitle, city });
    if (!best?.link) return null;

    if (LOG_EVENT) {
      console.log("🕸️ WEB pick:", {
        q,
        link: best.link,
        score: best._score,
        title: stripHtml(best.title || ""),
      });
    }

    const text = await scrapeMainText(best.link);
    if (!text || text.length < 30) return null;

    return { url: best.link, text };
  });

  const result = await p;
  if (result) setCache(cacheKey, result, 60 * 60 * 1000);
  return result;
}
