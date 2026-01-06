import React, { useEffect, useState } from "react";
import axios from "axios";
import EventCard from "./EventCard";
import "../../../../styles/side/city/event/EventList.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

const isCanceled = (err) =>
  err?.name === "CanceledError" || err?.code === "ERR_CANCELED";

const _eventCache = new Map();
const EVENT_TTL = 10 * 1000;
const _eventInflight = new Map();

function getCache(key) {
  const hit = _eventCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    _eventCache.delete(key);
    return null;
  }
  return hit.v;
}

function normalizeEventResponse(raw) {
  let list = [];
  let message = null;

  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && Array.isArray(raw.data)) {
    list = raw.data;
    if (raw.message) message = raw.message;
  } else if (raw && raw.ok === false) {
    message = raw.message || "이벤트 목록을 가져오는 중 문제가 발생했습니다.";
    list = Array.isArray(raw.data) ? raw.data : [];
  } else {
    message = "이벤트 데이터를 해석하지 못했어요.";
    list = [];
  }

  return { list, message };
}

function acquireEventRequest(key, makeRequest) {
  const cached = getCache(key);
  if (cached) return { promise: Promise.resolve(cached), release: () => {} };

  const existing = _eventInflight.get(key);
  if (existing) {
    existing.refs += 1;
    return {
      promise: existing.promise,
      release: () => releaseEventRequest(key),
    };
  }

  const ctrl = new AbortController();
  const entry = { ctrl, refs: 1, promise: null };

  entry.promise = (async () => {
    try {
      const normalized = await makeRequest(ctrl.signal);
      _eventCache.set(key, { v: normalized, exp: Date.now() + EVENT_TTL });
      return normalized;
    } finally {
      _eventInflight.delete(key);
    }
  })();

  _eventInflight.set(key, entry);
  return { promise: entry.promise, release: () => releaseEventRequest(key) };
}

function releaseEventRequest(key) {
  const entry = _eventInflight.get(key);
  if (!entry) return;

  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.ctrl.abort();
    _eventInflight.delete(key);
  }
}

export default function EventList({ areaCode, sigunguCode }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let alive = true;

    const hasArea = areaCode != null;
    const safeSigungu = hasArea ? sigunguCode : null;

    const key = `event/list|${hasArea ? areaCode : "all"}|${
      safeSigungu || "all"
    }`;

    const { promise, release } = acquireEventRequest(key, async (signal) => {
      const params = {};
      if (hasArea) params.areaCode = areaCode;
      if (hasArea && safeSigungu != null) params.sigunguCode = safeSigungu;

      const res = await axios.get(`${API_BASE}/event/list`, { params, signal });
      return normalizeEventResponse(res.data);
    });

    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { list, message } = await promise;
        if (!alive) return;

        if (message) setErrorMsg(message);
        setEvents(list.slice(0, 6));
      } catch (err) {
        if (!alive) return;
        if (isCanceled(err)) return;

        console.error("🔥 이벤트 목록 로드 실패:", err);
        setErrorMsg(
          err.response?.data?.message ||
            "지금 이벤트 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
        );
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      release();
    };
  }, [areaCode, sigunguCode]);

  if (loading)
    return <div className="event-loading">이벤트 불러오는 중...</div>;

  if (!events.length) {
    return (
      <div className="event-empty">
        {errorMsg ? errorMsg : "현재 표시할 이벤트가 없습니다."}
      </div>
    );
  }

  return (
    <div className="event-list-grid">
      {events.map((ev) => (
        <EventCard key={ev.contentId} item={ev} />
      ))}
    </div>
  );
}
