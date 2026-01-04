// src/pages/side/city/detail/PlaceDetail.jsx (경로는 너 프로젝트 기준)
// ※ 너가 올린 코드 기반 “전체본” + meta 400 방지 수정

import React, { useEffect, useMemo, useState } from "react";
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

  // 👉 목록/좋아요에서 넘어온 기본 정보
  const basePlace = location.state?.basePlace || null;
  const fromLocation = location.state?.from || null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [place, setPlace] = useState(basePlace);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ UI에만 보여줄 에러(= 진짜 실패만)
  const [uiError, setUiError] = useState(null);

  // ✅ contentTypeId를 (쿼리 → state/basePlace → DB(meta)) 순서로 확보
  const [resolvedTypeId, setResolvedTypeId] = useState(() => {
    if (queryType) return Number(queryType);
    if (basePlace?.contentTypeId) return Number(basePlace.contentTypeId);
    return null;
  });

  // 쿼리 type이 바뀌면 동기화
  useEffect(() => {
    if (queryType) setResolvedTypeId(Number(queryType));
  }, [queryType]);

  // ✅ overview 문자열 (목록/상세 중 있는 쪽 사용)
  let rawOverview = (place && place.overview) || (basePlace && basePlace.overview) || "";
  if (rawOverview === "설명 없음") rawOverview = "";

  // ✅ 한 줄 소개
  const oneLine = rawOverview.length > 0 ? rawOverview.split(/[\n.]/)[0].trim() : "";

  // ------------------------------
  // ✅ 좋아요 메타 (초기 liked / count / contentTypeId(DB))
  // ------------------------------
  useEffect(() => {
    if (!id) return;

    // ✅ userId는 “있을 때만” 넣는다 (400 방지 핵심)
    const uid = user?.user_id ?? user?.id ?? user?.userId ?? null;

    (async () => {
      try {
        const metaParams = { contentId: String(id) };
        if (uid != null) metaParams.userId = String(uid); // 있어야만 붙임

        const res = await placeLikesApi.meta(metaParams);

        setLikeCount(res.data.likesCount ?? 0);
        setLiked(!!res.data.liked);

        // ✅ 쿼리에 type이 없고, 아직 resolvedTypeId도 없으면 DB값으로 채움
        if (!queryType && !resolvedTypeId && res.data.contentTypeId) {
          setResolvedTypeId(Number(res.data.contentTypeId));
        }
      } catch (e) {
        console.error("like meta load fail", e);
        // ✅ meta 실패는 치명적이지 않으니 UI 에러는 안 띄워도 됨
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // =========================================================
  // ✅ contentTypeId 자동 탐색
  // =========================================================
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
            params: { contentId: String(id), contentTypeId: t },
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
        } catch (e) {
          continue;
        }
      }
    };

    probe();
    return () => {
      cancelled = true;
    };
  }, [id, queryType, resolvedTypeId]);

  // ------------------------------
  // ✅ 상세정보 불러오기 (resolvedTypeId 확보 후)
  // ------------------------------
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
            contentId: String(id),
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

  // 🔹 위치(도시명) 추출
  const shortLocation = place?.address ? place.address.split(" ")[1] || place.address : "";

  // 🔥 좋아요 토글
  const handleToggleLike = async () => {
    if (!place) return;

    const uid = user?.user_id ?? user?.id ?? user?.userId ?? null;
    if (!uid) {
      alert("로그인 후 사용할 수 있어요!");
      return;
    }

    const newLiked = !liked;

    // ✅ UI 먼저 반영
    setLiked(newLiked);
    setLikeCount((prev) => Math.max(0, prev + (newLiked ? 1 : -1)));

    const payload = {
      contentId: String(place.contentId || id),
      liked: newLiked,
      userId: String(uid),
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

      // ✅ 서버 기준으로 다시 동기화
      const metaParams = { contentId: String(id), userId: String(uid) };
      const metaRes = await placeLikesApi.meta(metaParams);

      setLikeCount(metaRes.data.likesCount ?? 0);
      setLiked(!!metaRes.data.liked);

      if (!resolvedTypeId && metaRes.data.contentTypeId) {
        setResolvedTypeId(Number(metaRes.data.contentTypeId));
      }
    } catch (err) {
      console.error("좋아요 저장 실패:", err);

      // ✅ 실패 시 롤백
      setLiked(!newLiked);
      setLikeCount((prev) => Math.max(0, prev + (newLiked ? -1 : 1)));
    }
  };

  if (loading && !place) return <div className="place-detail-loading">불러오는 중...</div>;

  if (!place) {
    return <div className="place-detail-loading">장소 정보를 불러오지 못했습니다.</div>;
  }

  // 태그 뱃지
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

            <div className="pd-hero-overlay">
              <h1 className="pd-title">{place.title}</h1>

              <div className="pd-meta-row">
                <span className="pd-location">{shortLocation}</span>
                <span className="pd-likes">❤️ {likeCount.toLocaleString()}명</span>
              </div>
            </div>
          </div>
        </section>

        <section className="pd-content">
          <div className="pd-actions">
            <button className={`pd-btn primary ${liked ? "active" : ""}`} onClick={handleToggleLike}>
              {liked ? "저장됨 ✔" : "이 장소 저장하기"}
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
                <PlaceDetailMap lat={place.mapY || place.latitude} lng={place.mapX || place.longitude} title={place.title} />
              </section>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
