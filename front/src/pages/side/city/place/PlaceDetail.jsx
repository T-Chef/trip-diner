import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import { placeLikesApi } from "../../../../api/placeLikesApi";

import Header from "../../../../components/home/Header.jsx";
import SideMenu from "../../../../components/home/SideMenu.jsx";
import PlaceDetailMap from "./PlaceDetailMap";

import "../../../../styles/side/city/PlaceDetail.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function PlaceDetail({ user, setUser }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryType = query.get("type");

  const basePlace = location.state?.basePlace || null;
  const fromLocation = location.state?.from || null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [place, setPlace] = useState(basePlace);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);
  const hlTimerRef = useRef(null);
  const tsTimerRef = useRef(null);
  const [mapHighlight, setMapHighlight] = useState(false);
  const [mapToast, setMapToast] = useState(false);

  const [shareToast, setShareToast] = useState(false);
  const shareTimerRef = useRef(null);

  // ✅ bump (Hero + 본문 공용)
  const [likeBump, setLikeBump] = useState(false);
  const likeBumpTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(hlTimerRef.current);
      window.clearTimeout(tsTimerRef.current);
      window.clearTimeout(shareTimerRef.current);
      window.clearTimeout(likeBumpTimerRef.current);
    };
  }, []);

  const scrollToMap = useCallback(() => {
    const el = mapRef.current;
    if (!el) return;

    const headerOffset = 84;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top, behavior: "smooth" });

    setMapHighlight(true);
    window.clearTimeout(hlTimerRef.current);
    hlTimerRef.current = window.setTimeout(() => setMapHighlight(false), 1200);

    setMapToast(true);
    window.clearTimeout(tsTimerRef.current);
    tsTimerRef.current = window.setTimeout(() => setMapToast(false), 1400);
  }, []);

  const [uiError, setUiError] = useState(null);

  const [resolvedTypeId, setResolvedTypeId] = useState(() => {
    if (queryType) return Number(queryType);
    if (basePlace?.contentTypeId) return Number(basePlace.contentTypeId);
    return null;
  });

  useEffect(() => {
    if (queryType) setResolvedTypeId(Number(queryType));
  }, [queryType]);

  let rawOverview = (place && place.overview) || (basePlace && basePlace.overview) || "";
  if (rawOverview === "설명 없음") rawOverview = "";
  const oneLine = rawOverview.length > 0 ? rawOverview.split(/[\n.]/)[0].trim() : "";

  // ------------------------------
  // 좋아요 meta
  // ------------------------------
  useEffect(() => {
    if (!id) return;

    const uid = user?.user_id ?? user?.id ?? user?.userId ?? null;

    (async () => {
      try {
        const res = await placeLikesApi.meta({
          contentId: id,
          userId: uid || undefined,
        });

        setLikeCount(res.data.likesCount ?? 0);
        setLiked(!!res.data.liked);

        if (!queryType && !resolvedTypeId && res.data.contentTypeId) {
          setResolvedTypeId(Number(res.data.contentTypeId));
        }
      } catch (e) {
        console.error("like meta load fail", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // contentTypeId 자동 탐색
  useEffect(() => {
    if (!id) return;
    if (queryType) return;
    if (resolvedTypeId) return;

    let cancelled = false;
    const CANDIDATES = [12, 14, 15, 28, 32, 38, 39];

    const probe = async () => {
      for (const t of CANDIDATES) {
        if (cancelled) return;

        try {
          const res = await axios.get(`${API_BASE}/place/detail`, {
            params: { contentId: id, contentTypeId: t },
            timeout: 8000,
          });

          const data = res.data;

          if (data && data.ok !== false) {
            const hasMeaningful =
              !!data.title ||
              !!data.address ||
              !!data.overview ||
              !!data.image ||
              data.mapX != null ||
              data.mapY != null;

            if (hasMeaningful) {
              setResolvedTypeId(t);
              return;
            }
          }
        } catch {
          continue;
        }
      }
    };

    probe();
    return () => {
      cancelled = true;
    };
  }, [id, queryType, resolvedTypeId]);

  // 상세정보 fetch
  useEffect(() => {
    if (!id || !resolvedTypeId) return;

    const makeOverview = (title, address) => {
      const t = (title || "").trim();
      const a = (address || "").trim();
      if (a && t) return `${a}에 위치한 "${t}" 장소입니다.`;
      if (t) return `"${t}"에 대한 소개가 아직 준비 중인 장소입니다.`;
      return "";
    };

    const pick = (...vals) => {
      for (const v of vals) {
        if (v === null || v === undefined) continue;
        const s = typeof v === "string" ? v.trim() : v;
        if (s) return v;
      }
      return null;
    };

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setUiError(null);

        const res = await axios.get(`${API_BASE}/place/detail`, {
          params: {
            contentId: id,
            contentTypeId: resolvedTypeId,
            title: basePlace?.title,
            address: basePlace?.address,
            tel: basePlace?.tel,
          },
        });

        const data = res.data;

        if (data?.message && !data?.noDetail && data?.ok !== false) {
          setUiError(data.message);
        }

        setPlace((prev) => {
          const merged = { ...(prev || {}), ...(data || {}) };

          merged.image = pick(data?.image, prev?.image, basePlace?.image);
          merged.mapX = pick(
            data?.mapX,
            data?.longitude,
            prev?.mapX,
            prev?.longitude,
            basePlace?.longitude
          );
          merged.mapY = pick(
            data?.mapY,
            data?.latitude,
            prev?.mapY,
            prev?.latitude,
            basePlace?.latitude
          );

          merged.overview = pick(
            data?.overview,
            prev?.overview,
            basePlace?.overview,
            makeOverview(merged.title || basePlace?.title, merged.address || basePlace?.address)
          );

          return merged;
        });

        if (data?.likesCount != null) setLikeCount(data.likesCount);
      } catch (err) {
        console.error("🔴 Place detail load error:", err);
        const serverMsg =
          err.response?.data?.message ||
          "장소 상세 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        setUiError(serverMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, resolvedTypeId]);

  const shortLocation = place?.address ? place.address.split(" ")[1] || place.address : "";

  // ✅ 0.8초(820ms) 싱크로 bump/글로우
  const triggerLikeBump = () => {
    setLikeBump(true);
    window.clearTimeout(likeBumpTimerRef.current);
    likeBumpTimerRef.current = window.setTimeout(() => setLikeBump(false), 820);
  };

  const handleToggleLike = async () => {
    if (!place) return;

    const uid = user?.user_id ?? user?.id ?? user?.userId ?? null;
    if (!uid) {
      alert("로그인 후 사용할 수 있어요!");
      return;
    }

    const newLiked = !liked;

    // optimistic
    setLiked(newLiked);
    setLikeCount((prev) => Math.max(0, prev + (newLiked ? 1 : -1)));

    // ✅ 저장될 때만: bump + 글로우 1회
    if (newLiked) triggerLikeBump();
    else {
      setLikeBump(false);
      window.clearTimeout(likeBumpTimerRef.current);
    }

    const payload = {
      contentId: place.contentId || id,
      liked: newLiked,
      userId: uid,
      title: place.title || basePlace?.title || "",
      address: place.address || basePlace?.address || "",
      image: place.image || basePlace?.image || null,
      lat: place.mapY ?? place.latitude ?? basePlace?.latitude ?? null,
      lng: place.mapX ?? place.longitude ?? basePlace?.longitude ?? null,
      category: Array.isArray(place.tags) && place.tags.length ? place.tags[0] : undefined,
      cityId: null,
      contentTypeId: resolvedTypeId ?? basePlace?.contentTypeId ?? undefined,
    };

    try {
      await placeLikesApi.toggle(payload);

      const metaRes = await placeLikesApi.meta({ contentId: id, userId: uid });
      setLikeCount(metaRes.data.likesCount ?? 0);
      setLiked(!!metaRes.data.liked);

      if (!resolvedTypeId && metaRes.data.contentTypeId) {
        setResolvedTypeId(Number(metaRes.data.contentTypeId));
      }
    } catch (err) {
      console.error("좋아요 저장 실패:", err);

      // rollback
      setLiked(!newLiked);
      setLikeCount((prev) => Math.max(0, prev + (newLiked ? -1 : 1)));

      setLikeBump(false);
      window.clearTimeout(likeBumpTimerRef.current);
    }
  };

  if (loading && !place) return <div className="place-detail-loading">불러오는 중...</div>;
  if (!place) return <div className="place-detail-loading">장소 정보를 불러오지 못했습니다.</div>;

  const tags = Array.isArray(place.tags) && place.tags.length > 0 ? place.tags : ["여행지"];
  const finalTel = place.tel || basePlace?.tel || "";

  const handleBack = () => {
    if (fromLocation) {
      navigate(fromLocation.pathname + fromLocation.search);
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    const params = new URLSearchParams(location.search);
    params.delete("type");
    const qs = params.toString();
    navigate(`/city${qs ? `?${qs}` : ""}`);
  };

  const canMap = (place?.mapY || place?.latitude) && (place?.mapX || place?.longitude);

  const getHomepageUrl = () => {
    const raw = (place?.homepage || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith("www.")) return `https://${raw}`;
    return raw;
  };

  const handleOpenDirections = () => {
    if (!canMap) return;

    const lat = place.mapY || place.latitude;
    const lng = place.mapX || place.longitude;
    const name = encodeURIComponent(place.title || "목적지");

    const kakao = `https://map.kakao.com/link/to/${name},${lat},${lng}`;
    const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;

    window.open(kakao || google, "_blank", "noreferrer");
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = place?.title || "Trip-Diner 장소";

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareToast(true);
      window.clearTimeout(shareTimerRef.current);
      shareTimerRef.current = window.setTimeout(() => setShareToast(false), 1300);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);

      setShareToast(true);
      window.clearTimeout(shareTimerRef.current);
      shareTimerRef.current = window.setTimeout(() => setShareToast(false), 1300);
    }
  };

  return (
    <>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
      <SideMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} setUser={setUser} />

      <div className="place-detail-page">
        <section className="pd-hero">
          <button className="pd-back-btn" onClick={handleBack}>
            ← 뒤로
          </button>

          <div className="pd-hero-image-wrap">
            <img
              src={place.image || "/assets/images/default-placeholder.jpg"}
              alt={place.title}
              className="pd-hero-image"
              onError={(e) => {
                e.target.src = "/assets/images/default-placeholder.jpg";
              }}
            />

            <div className="pd-hero-actions">
              {/* ✅ Hero 저장 칩: bump + 글로우 */}
              <button
                type="button"
                className={`pd-hero-action pd-hero-action--like ${
                  liked ? "is-active" : ""
                } ${likeBump ? "is-bump" : ""}`}
                onClick={handleToggleLike}
                title={liked ? "저장됨" : "저장하기"}
              >
                {liked ? "저장됨" : "저장"}
              </button>

              {getHomepageUrl() ? (
                <a
                  className="pd-hero-action"
                  href={getHomepageUrl()}
                  target="_blank"
                  rel="noreferrer"
                  title="홈페이지 새 창 열기"
                >
                  홈페이지
                </a>
              ) : null}

              <button
                type="button"
                className={`pd-hero-action ${canMap ? "" : "is-disabled"}`}
                onClick={handleOpenDirections}
                disabled={!canMap}
                title={canMap ? "길찾기" : "좌표 정보 없음"}
              >
                길찾기
              </button>

              <button type="button" className="pd-hero-action" onClick={handleShare} title="공유하기">
                공유
              </button>
            </div>

            <div className={`pd-hero-toast ${shareToast ? "is-show" : ""}`}>링크가 복사됐어요</div>

            <div className="pd-hero-overlay">
              <h1 className="pd-title">{place.title}</h1>

              <div className="pd-meta-row">
                <span className="pd-location">{shortLocation}</span>
                <span className="pd-likes">❤️ {likeCount.toLocaleString()}명</span>

                {canMap ? (
                  <span
                    className="pd-chip pd-chip--click"
                    role="button"
                    tabIndex={0}
                    title="지도 영역으로 이동"
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

        <section className="pd-content">
          {/* ✅ 본문 저장 버튼도 bump + 하트 아이콘 뿅 */}
          <div className="pd-actions">
            <button
              className={`pd-btn primary pd-like-btn ${liked ? "active" : ""} ${
                likeBump ? "is-bump" : ""
              }`}
              onClick={handleToggleLike}
              type="button"
            >
              <span className="pd-like-btn__icon" aria-hidden="true">
                ❤️
              </span>
              <span className="pd-like-btn__text">
                {liked ? "저장됨 ✔" : "이 장소 저장하기"}
              </span>
            </button>
          </div>

          <div className="pd-main-grid">
            <div className="pd-left">
              <section className="pd-section">
                <h2 className="pd-section-title">기본 정보</h2>

                {uiError && <div className="pd-alert">⚠ {uiError}</div>}

                {oneLine ? (
                  <p className="pd-one-line">{oneLine}</p>
                ) : (
                  <p className="pd-one-line pd-one-line-dim">상세 설명이 아직 준비되지 않은 장소예요.</p>
                )}

                <div className="pd-tags">
                  {tags.map((tag) => (
                    <span key={tag} className="pd-tag">
                      #{tag}
                    </span>
                  ))}
                </div>

                <ul className="pd-info-list">
                  <li>
                    <span className="pd-info-label">주소</span>
                    <span className="pd-info-value">{place.address || "주소 정보 없음"}</span>
                  </li>
                  <li>
                    <span className="pd-info-label">전화번호</span>
                    <span className="pd-info-value">{finalTel || "전화번호 정보 없음"}</span>
                  </li>
                  {place.homepage && (
                    <li>
                      <span className="pd-info-label">홈페이지</span>
                      <a href={place.homepage} target="_blank" rel="noreferrer" className="pd-info-link">
                        홈페이지 바로가기 ↗
                      </a>
                    </li>
                  )}
                </ul>
              </section>
            </div>

            <div className="pd-right">
              <section className="pd-section">
                <h2 className="pd-section-title">위치</h2>

                <div className={`pd-map-card ${mapHighlight ? "is-highlight" : ""}`} ref={mapRef}>
                  <div className={`pd-map-toast ${mapToast ? "is-show" : ""}`}>
                    <span className="pd-map-toast__icon" aria-hidden="true">
                      🗺️
                    </span>
                    <span className="pd-map-toast__text">지도 영역</span>
                  </div>

                  <PlaceDetailMap
                    lat={place.mapY || place.latitude}
                    lng={place.mapX || place.longitude}
                    title={place.title}
                  />
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
