// front/src/pages/city/EventDetail.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../../../../components/home/Header.jsx";
import SideMenu from "../../../../components/home/SideMenu.jsx";
import EventDetailMap from "./EventDetailMap";
import "../../../../styles/side/city/event/EventDetail.css";

const API_BASE = process.env.REACT_APP_API_BASE || "/api";

// ✅ 세션 캐시 TTL (성공 6시간, fallback/noDetail 30초)
const CACHE_TTL_SUCCESS = 6 * 60 * 60 * 1000;
const CACHE_TTL_FALLBACK = 30 * 1000;

function setSessionCache(key, data, ttlMs) {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        data,
        exp: Date.now() + ttlMs,
      })
    );
  } catch {}
}

function getSessionCache(key) {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // ✅ 구버전(그냥 data만 저장돼 있던 케이스) 호환
    if (parsed && parsed.exp == null && parsed.data == null) return parsed;

    if (!parsed?.exp || Date.now() > parsed.exp) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

/** =========================
 *  Overview 파싱 유틸
 * ========================= */
const NOISE_LINE_RE =
  /^(홈|문화체험|한눈에 보는 문화정보|SNS 공유|페이스북|트위터|카카오톡|주소 복사|점자|화면 프린트|스크랩|위치안내|주변 관광지|행사장의 진행중인 행사)$/;

const SCRIPTY_RE =
  /(document\.|window\.|addEventListener|function\s*\(|onload\s*=|\$\(|return false|var\s+|try\s*\{|eval\(|\}\s*$)/i;

const FIELD_LABELS = [
  "기간",
  "주소",
  "주최/주관",
  "주최",
  "주관",
  "문의",
  "전화",
  "연락처",
  "공식 홈페이지",
  "공식홈페이지",
  "홈페이지",
];

function stripHtml(s = "") {
  return String(s).replace(/<[^>]+>/g, "").trim();
}

function extractHrefFromAnchor(html = "") {
  const s = String(html || "");
  const m = s.match(/href\s*=\s*["']([^"']+)["']/i);
  return m?.[1] || "";
}

function normalizeUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("www.")) return `https://${u}`;
  return u;
}

function parseOverviewToFields(rawOverview = "") {
  const raw = String(rawOverview || "");
  if (!raw.trim()) return { fields: [], cleaned: "" };

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((l) => !NOISE_LINE_RE.test(l))
    .filter((l) => !SCRIPTY_RE.test(l));

  if (lines.length === 0) return { fields: [], cleaned: "" };

  const fields = [];
  const usedIdx = new Set();
  const isLabel = (s) => FIELD_LABELS.includes(s);

  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i];

    // "기간: 2024-..." 같은 케이스
    const colonLike = cur.match(/^(.{1,12})\s*[:：]\s*(.+)$/);
    if (colonLike) {
      const label = colonLike[1].trim();
      const value = colonLike[2].trim();
      if (isLabel(label) && value) {
        fields.push({ label, value });
        usedIdx.add(i);
      }
      continue;
    }

    // "기간" 다음줄이 값인 케이스
    if (isLabel(cur)) {
      let j = i + 1;
      while (j < lines.length && !lines[j]) j++;

      const value = lines[j] || "";
      if (value && !isLabel(value)) {
        fields.push({ label: cur, value });
        usedIdx.add(i);
        usedIdx.add(j);
      }
    }
  }

  // 중복 라벨은 마지막 값 우선
  const dedupMap = new Map();
  for (const f of fields) dedupMap.set(f.label, f.value);
  const dedupFields = Array.from(dedupMap.entries()).map(([label, value]) => ({
    label,
    value,
  }));

  const cleanedLines = lines.filter((_, idx) => !usedIdx.has(idx));
  const cleaned = cleanedLines.join("\n").trim();

  return { fields: dedupFields, cleaned };
}

/** =========================
 *  ✅ 두 줄까지만 + 더보기(접기)
 *  - 텍스트가 실제로 2줄을 넘을 때만 버튼 표시
 *  - white-space: pre-line 유지
 * ========================= */
function ExpandableText({
  text = "",
  lines = 2,
  className = "",
  style = {},
  moreLabel = "더보기",
  lessLabel = "접기",
}) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const ref = useRef(null);

  const t = String(text ?? "").trim();

  useEffect(() => {
    setExpanded(false);
  }, [t]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 레이아웃 반영 후 높이 비교
    const raf = requestAnimationFrame(() => {
      // 접힌 상태 기준으로 overflow 여부 판정
      // (expanded가 true면 판정이 틀어질 수 있으니 일단 false로 고정하여 검사)
      const prevExpanded = expanded;
      if (prevExpanded) {
        // expanded 상태면 일시적으로 clamp 스타일을 적용해 측정
        el.style.display = "-webkit-box";
        el.style.webkitBoxOrient = "vertical";
        el.style.webkitLineClamp = String(lines);
        el.style.overflow = "hidden";
      }

      const isOverflowing = el.scrollHeight > el.clientHeight + 1;
      setCanExpand(isOverflowing);

      // 원복
      if (prevExpanded) {
        el.style.display = "";
        el.style.webkitBoxOrient = "";
        el.style.webkitLineClamp = "";
        el.style.overflow = "";
      }
    });

    return () => cancelAnimationFrame(raf);
    // expanded는 측정 시점에만 참조하므로 deps에 포함
  }, [t, lines, expanded]);

  if (!t) return <span className={className}>-</span>;

  const clampStyle = expanded
    ? {}
    : {
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflow: "hidden",
      };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div
        ref={ref}
        className={className}
        style={{
          whiteSpace: "pre-line",
          ...clampStyle,
          ...style,
        }}
      >
        {t}
      </div>

      {canExpand && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            justifySelf: "start",
            border: "none",
            background: "transparent",
            padding: 0,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 800,
            color: "#2563eb",
          }}
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}

export default function EventDetail({ user, setUser }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [event, setEvent] = useState(null);

  const lastSuccessKeyRef = useRef("");
  const inFlightRef = useRef(false);

  // ✅ query의 type (우선순위 1)
  const queryType = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get("type");
  }, [location.search]);

  // ✅ 목록에서 넘어온 baseEvent (우선순위 2)
  const stateBaseEvent = location.state?.baseEvent || null;

  // ✅ safeType: query > state > default
  const safeType = useMemo(() => {
    return (
      queryType ||
      stateBaseEvent?.contentTypeId ||
      stateBaseEvent?.contenttypeid ||
      "15"
    );
  }, [queryType, stateBaseEvent]);

  // ✅ baseEvent 저장 키
  const baseStorageKey = useMemo(() => {
    return `eventBase:${id}|${safeType}`;
  }, [id, safeType]);

  // ✅ 새로고침/직접접근 대비: sessionStorage baseEvent 복구
  const storageBaseEvent = useMemo(() => {
    try {
      const v = sessionStorage.getItem(baseStorageKey);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  }, [baseStorageKey]);

  // ✅ 최종 baseEvent
  const baseEvent = stateBaseEvent || storageBaseEvent || null;

  // ✅ safeContentTypeId: query > baseEvent > default
  const safeContentTypeId = useMemo(() => {
    return (
      queryType ||
      baseEvent?.contentTypeId ||
      baseEvent?.contenttypeid ||
      "15"
    );
  }, [queryType, baseEvent]);

  const fmt = useCallback((yyyymmdd) => {
    if (!yyyymmdd || typeof yyyymmdd !== "string") return "";
    const y = yyyymmdd.slice(0, 4);
    const m = yyyymmdd.slice(4, 6);
    const d = yyyymmdd.slice(6, 8);
    return `${y}.${m}.${d}`;
  }, []);

  // ✅ detail 응답 merge (noDetail이면 baseEvent 값을 유지)
  const mergeEvent = useCallback(
    (prevOrBase, data) => {
      const base = prevOrBase || baseEvent || {};
      const merged = { ...base, ...(data || {}) };

      const keepKeys = [
        "title",
        "address",
        "image",
        "startDate",
        "endDate",
        "mapX",
        "mapY",
        "homepage",
        "tel",
        "officialUrl",
      ];

      if (data?.noDetail) {
        keepKeys.forEach((k) => {
          merged[k] = base?.[k] ?? merged[k];
        });
      } else {
        keepKeys.forEach((k) => {
          if (merged[k] == null || merged[k] === "") merged[k] = base?.[k] ?? merged[k];
        });
      }

      return merged;
    },
    [baseEvent]
  );

  // ✅ (A) state로 넘어온 baseEvent가 있으면 세션에 저장
  useEffect(() => {
    if (!id || !safeType) return;
    if (!stateBaseEvent) return;
    try {
      sessionStorage.setItem(baseStorageKey, JSON.stringify(stateBaseEvent));
    } catch {}
  }, [id, safeType, stateBaseEvent, baseStorageKey]);

  // ✅ (B) id/baseEvent 바뀌면 화면을 baseEvent로 즉시 갱신
  useEffect(() => {
    setEvent(baseEvent || null);
  }, [id, baseEvent]);

  // ✅ (C) 상세 fetch (항상 실행)
  useEffect(() => {
    if (!id || !safeContentTypeId) return;

    const key = `${id}|${safeContentTypeId}`;
    const storageKey = `eventDetail:${key}`;

    // 0) 세션 캐시 있으면 즉시 반영
    const cachedData = getSessionCache(storageKey);
    if (cachedData) {
      setEvent((prev) => mergeEvent(prev || baseEvent || {}, cachedData));

      if (!cachedData?.noDetail) {
        lastSuccessKeyRef.current = key;
        return;
      }
    }

    if (lastSuccessKeyRef.current === key) return;
    if (inFlightRef.current) return;

    const controller = new AbortController();

    const fetchDetail = async () => {
      try {
        inFlightRef.current = true;

        const res = await axios.get(`${API_BASE}/event/detail`, {
          params: {
            contentId: id,
            contentTypeId: safeContentTypeId,

            // ✅ 쿼터 fallback용 힌트
            title: baseEvent?.title || "",
            address: baseEvent?.address || "",
            mapX: baseEvent?.mapX || baseEvent?.mapx || "",
            mapY: baseEvent?.mapY || baseEvent?.mapy || "",
            image: baseEvent?.image || "",
            startDate: baseEvent?.startDate || "",
            endDate: baseEvent?.endDate || "",
            tel: baseEvent?.tel || "",
          },
          signal: controller.signal,
        });

        const data = res.data;

        setEvent((prev) => mergeEvent(prev || baseEvent || {}, data));
        if (!data?.noDetail) lastSuccessKeyRef.current = key;

        setSessionCache(
          storageKey,
          data,
          data?.noDetail ? CACHE_TTL_FALLBACK : CACHE_TTL_SUCCESS
        );
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        // UI에서 에러 텍스트를 보여주지 않기로 했으니 조용히 종료
      } finally {
        inFlightRef.current = false;
      }
    };

    fetchDetail();
    return () => controller.abort();
  }, [id, safeContentTypeId, baseEvent, mergeEvent]);

  const parsed = useMemo(() => {
    return parseOverviewToFields(event?.overview || "");
  }, [event?.overview]);

  // ✅ 공식 링크(홈페이지/officialUrl/anchor href) 최종 정리
  const officialLink = useMemo(() => {
    const rawHomepage = event?.homepage || "";
    const href = extractHrefFromAnchor(rawHomepage);
    const u = href || stripHtml(rawHomepage) || event?.officialUrl || "";
    return normalizeUrl(u);
  }, [event?.homepage, event?.officialUrl]);

  // ✅ 기간 문자열(카드에서 확실히 보이게)
  const periodText = useMemo(() => {
    const s = event?.startDate ? fmt(event.startDate) : "";
    const e = event?.endDate ? fmt(event.endDate) : "";
    if (s && e) return `${s} ~ ${e}`;
    if (s && !e) return `${s} ~`;
    if (!s && e) return `~ ${e}`;
    return "";
  }, [event?.startDate, event?.endDate, fmt]);

  // ✅ 카드 4개 고정: 기간 / 주소 / 문의 / 주최·주관
  const infoCards = useMemo(() => {
    const pickField = (...labels) => {
      for (const lb of labels) {
        const hit = (parsed.fields || []).find((f) => f?.label === lb && f?.value);
        if (hit?.value) return hit.value;
      }
      return "";
    };

    const period = periodText || pickField("기간") || "-";
    const address = event?.address || pickField("주소") || "-";
    const tel = event?.tel || pickField("문의", "전화", "연락처") || "-";
    const host = pickField("주최/주관", "주최", "주관") || "-";

    return [
      { label: "기간", value: period },
      { label: "주소", value: address },
      { label: "문의", value: tel },
      { label: "주최/주관", value: host },
    ];
  }, [event?.address, event?.tel, parsed.fields, periodText]);

  if (!event) {
    return <div className="event-detail-loading">이벤트 정보를 불러오지 못했습니다.</div>;
  }

  return (
    <>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
      <SideMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        setUser={setUser}
      />

      <div className="event-detail-page">
        <section className="event-hero">
          <button className="event-back-btn" onClick={() => navigate(-1)}>
            ← 목록으로
          </button>

          <div className="event-hero-image-wrap">
            <img
              src={event.image || "/assets/images/default-placeholder.jpg"}
              alt={event.title || "event"}
              onError={(e) => {
                e.currentTarget.src = "/assets/images/default-placeholder.jpg";
              }}
            />
          </div>
        </section>

        <section className="event-content">
          {/* ✅ 정보 카드 + 공식 링크 */}
          <div className="event-top-block">
            <div className="event-actions-row">
              <h2 className="event-section-title">이벤트 정보</h2>

              {officialLink && (
                <a
                  className="event-homepage-link"
                  href={officialLink}
                  target="_blank"
                  rel="noreferrer"
                  title="공식 페이지 새 창 열기"
                >
                  공식 페이지 보기 ↗
                </a>
              )}
            </div>

            {/* ✅ 이벤트 정보 밑엔 제목만 */}
            <div className="event-info-title">{event.title}</div>

            <div className="event-info-grid">
              {infoCards.map((c) => {
                const isPeriod = c.label === "기간";
                return (
                  <div className="event-info-card" key={`${c.label}-${c.value}`}>
                    <div className="event-info-label">{c.label}</div>

                    <div className="event-info-value">
                      {isPeriod ? (
                        c.value || "-"
                      ) : (
                        <ExpandableText
                          text={c.value || "-"}
                          lines={2}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ✅ 지도만 유지 */}
          <div className="event-map-card">
            <EventDetailMap
              title={event.title}
              address={event.address}
              mapX={event.mapX}
              mapY={event.mapY}
            />
          </div>
        </section>
      </div>
    </>
  );
}
