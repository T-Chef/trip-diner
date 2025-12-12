// front/src/components/city/EventDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../home/Header";
import SideMenu from "../home/SideMenu";
import "../../styles/page/city/EventDetail.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function EventDetail({ user, setUser }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const queryType = query.get("type");

  const baseEvent = location.state?.baseEvent || null;

  const safeContentTypeId =
    queryType || baseEvent?.contentTypeId || baseEvent?.contenttypeid || "15";

  const [menuOpen, setMenuOpen] = useState(false);
  const [event, setEvent] = useState(baseEvent);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // (원하면 상세에서도 날짜 포맷 쓸 수 있게)
  const fmt = (yyyymmdd) => {
    if (!yyyymmdd || typeof yyyymmdd !== "string") return "";
    const y = yyyymmdd.slice(0, 4);
    const m = yyyymmdd.slice(4, 6);
    const d = yyyymmdd.slice(6, 8);
    return `${y}.${m}.${d}`;
  };

  useEffect(() => {
    if (!id || !safeContentTypeId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await axios.get(`${API_BASE}/event/detail`, {
          params: { contentId: id, contentTypeId: safeContentTypeId },
        });

        const data = res.data;

        if (data.message) {
          setErrorMsg(data.message);
        }
        
        // 목록에서 넘어온 정보 + 서버 상세정보
        setEvent((prev) => ({
          ...(prev || {}),
          ...data,
        }));
      } catch (err) {
        console.error("🔴 Event detail load error:", err);
        const msg =
          err.response?.data?.message ||
          "이벤트 상세 정보를 불러오는 중 오류가 발생했습니다.";
        setErrorMsg(msg);
        setEvent((prev) => prev || baseEvent || null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, safeContentTypeId, baseEvent]);

  if (loading && !event) {
    return <div className="event-detail-loading">불러오는 중...</div>;
  }

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
              alt={event.title}
              onError={(e) => {
                e.target.src = "/assets/images/default-placeholder.jpg";
              }}
            />

            <div className="event-hero-overlay">
              <h1 className="event-title">{event.title}</h1>
              <p className="event-address">{event.address}</p>
            </div>
          </div>
        </section>

        <section className="event-content">
          {errorMsg && <div className="event-alert">⚠ {errorMsg}</div>}

          {/* 원하면 여기에도 기간 표시 가능 */}
          {event.startDate && event.endDate && (
            <p className="event-period">
              {fmt(event.startDate)} ~ {fmt(event.endDate)}
            </p>
          )} 

          <h2 className="event-section-title">이벤트 소개</h2>
          <p className="event-overview">
            {event.overview 
            ? event.overview
            : "상세 설명을 불러오는 중 문제가 발생했습니다."}
          </p>

          {event.homepage && (
            <a
              href={event.homepage}
              target="_blank"
              rel="noreferrer"
              className="event-homepage-link"
            >
              공식 페이지 바로가기 ↗
            </a>
          )}
        </section>
      </div>
    </>
  );
}
