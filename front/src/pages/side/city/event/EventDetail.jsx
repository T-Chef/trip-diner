import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../../../../components/home/Header.jsx";
import SideMenu from "../../../../components/home/SideMenu.jsx";
import EventDetailMap from "./EventDetailMap";
import "../../../../styles/side/city/event/EventDetail.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";
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

// 노이즈 라인 정규식
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
  return String(s)
    .replace(/<[^>]+>/g, "")
    .trim();
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

// 확장 가능한 텍스트
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

    const raf = requestAnimationFrame(() => {
      const prevExpanded = expanded;
      if (prevExpanded) {
        el.style.display = "-webkit-box";
        el.style.webkitBoxOrient = "vertical";
        el.style.webkitLineClamp = String(lines);
        el.style.overflow = "hidden";
      }

      const isOverflowing = el.scrollHeight > el.clientHeight + 1;
      setCanExpand(isOverflowing);

      if (prevExpanded) {
        el.style.display = "";
        el.style.webkitBoxOrient = "";
        el.style.webkitLineClamp = "";
        el.style.overflow = "";
      }
    });

    return () => cancelAnimationFrame(raf);
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

  const mapRef = useRef(null);

  const [mapHighlight, setMapHighlight] = useState(false);

  const [mapToast, setMapToast] = useState(false);

  const scrollToMap = useCallback(() => {
    const el = mapRef.current;
    if (!el) return;

    const headerOffset = 84;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top, behavior: "smooth" });

    setMapHighlight(true);
    window.clearTimeout(scrollToMap._hl);
    scrollToMap._hl = window.setTimeout(() => setMapHighlight(false), 1200);

    setMapToast(true);
    window.clearTimeout(scrollToMap._ts);
    scrollToMap._ts = window.setTimeout(() => setMapToast(false), 1400);
  }, []);

  const queryType = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get("type");
  }, [location.search]);

  const stateBaseEvent = location.state?.baseEvent || null;

  const safeType = useMemo(() => {
    return (
      queryType ||
      stateBaseEvent?.contentTypeId ||
      stateBaseEvent?.contenttypeid ||
      "15"
    );
  }, [queryType, stateBaseEvent]);

  const baseStorageKey = useMemo(() => {
    return `eventBase:${id}|${safeType}`;
  }, [id, safeType]);

  const storageBaseEvent = useMemo(() => {
    try {
      const v = sessionStorage.getItem(baseStorageKey);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  }, [baseStorageKey]);

  const baseEvent = stateBaseEvent || storageBaseEvent || null;

  const safeContentTypeId = useMemo(() => {
    return (
      queryType || baseEvent?.contentTypeId || baseEvent?.contenttypeid || "15"
    );
  }, [queryType, baseEvent]);

  const fmt = useCallback((yyyymmdd) => {
    if (!yyyymmdd || typeof yyyymmdd !== "string") return "";
    const y = yyyymmdd.slice(0, 4);
    const m = yyyymmdd.slice(4, 6);
    const d = yyyymmdd.slice(6, 8);
    return `${y}.${m}.${d}`;
  }, []);

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
          if (merged[k] == null || merged[k] === "")
            merged[k] = base?.[k] ?? merged[k];
        });
      }

      return merged;
    },
    [baseEvent]
  );

  useEffect(() => {
    if (!id || !safeType) return;
    if (!stateBaseEvent) return;
    try {
      sessionStorage.setItem(baseStorageKey, JSON.stringify(stateBaseEvent));
    } catch {}
  }, [id, safeType, stateBaseEvent, baseStorageKey]);

  useEffect(() => {
    setEvent(baseEvent || null);
  }, [id, baseEvent]);

  useEffect(() => {
    if (!id || !safeContentTypeId) return;

    const key = `${id}|${safeContentTypeId}`;
    const storageKey = `eventDetail:${key}`;

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
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED")
          return;
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

  const officialLink = useMemo(() => {
    const rawHomepage = event?.homepage || "";
    const href = extractHrefFromAnchor(rawHomepage);
    const u = href || stripHtml(rawHomepage) || event?.officialUrl || "";
    return normalizeUrl(u);
  }, [event?.homepage, event?.officialUrl]);

  const periodText = useMemo(() => {
    const s = event?.startDate ? fmt(event.startDate) : "";
    const e = event?.endDate ? fmt(event.endDate) : "";
    if (s && e) return `${s} ~ ${e}`;
    if (s && !e) return `${s} ~`;
    if (!s && e) return `~ ${e}`;
    return "";
  }, [event?.startDate, event?.endDate, fmt]);

  const infoCards = useMemo(() => {
    const pickField = (...labels) => {
      for (const lb of labels) {
        const hit = (parsed.fields || []).find(
          (f) => f?.label === lb && f?.value
        );
        if (hit?.value) return hit.value;
      }
      return "";
    };

    // 정보 카드용 값들
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
    return (
      <div className="event-detail-loading">
        이벤트 정보를 불러오지 못했습니다.
      </div>
    );
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

            {officialLink && (
              <div className="event-hero-actions">
                <a
                  className="event-homepage-link event-homepage-link--hero"
                  href={officialLink}
                  target="_blank"
                  rel="noreferrer"
                  title="공식 페이지 새 창 열기"
                >
                  공식 페이지 보기 ↗
                </a>
              </div>
            )}

            <div className="event-hero-overlay">
              <div className="event-hero-title">{event.title || "이벤트"}</div>

              <div className="event-hero-meta">
                {periodText ? (
                  <span className="event-hero-chip" data-kind="period">
                    {periodText}
                  </span>
                ) : null}

                {event.address ? (
                  <span
                    className="event-hero-chip event-hero-chip--click"
                    data-kind="addr"
                    title={event.address}
                    role="button"
                    tabIndex={0}
                    onClick={scrollToMap}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") scrollToMap();
                    }}
                  >
                    지도 보기
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="event-content">
          <div className="event-top-block">
            <div className="event-actions-row">
              <h2 className="event-section-title">이벤트 정보</h2>
            </div>

            <div className="event-info-title">{event.title}</div>

            <div className="event-info-grid">
              {infoCards.map((c) => {
                const isPeriod = c.label === "기간";
                return (
                  <div
                    className="event-info-card"
                    data-label={c.label}
                    key={`${c.label}-${c.value}`}
                  >
                    <div className="event-info-label">{c.label}</div>

                    <div className="event-info-value">
                      {isPeriod ? (
                        c.value || "-"
                      ) : (
                        <ExpandableText text={c.value || "-"} lines={2} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`event-map-card ${mapHighlight ? "is-highlight" : ""}`}
            ref={mapRef}
          >
            <div className={`event-map-toast ${mapToast ? "is-show" : ""}`}>
              <span className="event-map-toast__icon" aria-hidden="true">
                🗺️
              </span>
              <span className="event-map-toast__text">지도 영역</span>
            </div>

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
