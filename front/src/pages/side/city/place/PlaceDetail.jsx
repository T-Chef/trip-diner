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

    const uid = user?.user_id ?? user?.id ?? user?.userId ?? null;

    (async () => {
      try {
        const res = await placeLikesApi.meta({
          contentId: id,
          userId: uid || undefined,
        });

        setLikeCount(res.data.likesCount ?? 0);
        setLiked(!!res.data.liked);

        // ✅ 쿼리에 type이 없고, 아직 resolvedTypeId도 없으면 DB값으로 채움
        if (!queryType && !resolvedTypeId && res.data.contentTypeId) {
          setResolvedTypeId(Number(res.data.contentTypeId));
        }
      } catch (e) {
        console.error("like meta load fail", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  // =========================================================
  // ✅ contentTypeId 자동 탐색 (useEffect 1개 추가)
  // - 조건: queryType 없음 + resolvedTypeId 없음
  // - 후보 타입을 /place/detail로 "가볍게" 찍어서 맞는 타입 찾기
  // - 찾으면 setResolvedTypeId()만 하고, 실제 상세 fetch는 아래 effect가 수행
  // =========================================================
  useEffect(() => {
    if (!id) return;
    if (queryType) return;          // 쿼리에 type 있으면 탐색 불필요
    if (resolvedTypeId) return;     // 이미 확보했으면 탐색 불필요

    let cancelled = false;

    // ✅ Tour API에서 자주 쓰는 contentTypeId 후보들
    // (필요하면 너 프로젝트에 맞게 추가/정리 가능)
    const CANDIDATES = [12, 14, 15, 28, 32, 38, 39];

    const probe = async () => {
      for (const t of CANDIDATES) {
        if (cancelled) return;

        try {
          const res = await axios.get(`${API_BASE}/place/detail`, {
            params: {
              contentId: id,
              contentTypeId: t,
            },
            timeout: 8000,
          });

          const data = res.data;

          // ✅ 성공 판정:
          // - 서버가 ok:false를 주지 않았고
          // - title/address/overview/image/map 등이 "뭔가라도" 채워져 있으면
          //   해당 t를 정답으로 채택
          if (data && data.ok !== false) {
            const hasMeaningful =
              !!data.title ||
              !!data.address ||
              !!data.overview ||
              !!data.image ||
              data.mapX != null ||
              data.mapY != null;

            // noDetail=true라도(대체 응답) 의미있는 값이 있으면 타입은 맞다고 보고 채택
            if (hasMeaningful) {
              setResolvedTypeId(t);
              return;
            }
          }
        } catch (e) {
          // 틀린 타입이면 보통 4xx/5xx로 떨어질 수 있음 → 다음 후보로 계속
          continue;
        }
      }

      // 여기까지 왔으면 후보에서 못 찾은 것
      // (쿼터 차단 / 데이터 자체가 특이 / 후보 타입이 누락 등)
      // 이 경우는 resolvedTypeId가 끝까지 null이라 상세 fetch가 안 돼서
      // UI에 "설명 없음"만 보일 수 있음.
      // 필요하면 여기서 안내 메세지 띄워도 됨:
      // setUiError("상세 타입을 자동으로 찾지 못했어요. 잠시 후 다시 시도해주세요.");
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

        // ✅ 이미지 보존: 새 데이터에 이미지 없으면 기존/베이스 이미지 유지
        merged.image = pick(data?.image, prev?.image, basePlace?.image);

        // ✅ 좌표도 종종 키가 달라서 보존(필요 시)
        merged.mapX = pick(data?.mapX, data?.longitude, prev?.mapX, prev?.longitude, basePlace?.longitude);
        merged.mapY = pick(data?.mapY, data?.latitude,  prev?.mapY, prev?.latitude,  basePlace?.latitude);

        // ✅ overview 보존
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
  const shortLocation = place?.address
    ? place.address.split(" ")[1] || place.address
    : "";

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
      contentId: place.contentId || id,
      liked: newLiked,
      userId: uid,
      title: place.title || basePlace?.title || "",
      address: place.address || basePlace?.address || "",
      image: place.image || basePlace?.image || null,
      lat: place.mapY ?? place.latitude ?? basePlace?.latitude ?? null,
      lng: place.mapX ?? place.longitude ?? basePlace?.longitude ?? null,
      category:
        Array.isArray(place.tags) && place.tags.length ? place.tags[0] : undefined,
      cityId: null,
      contentTypeId: resolvedTypeId ?? basePlace?.contentTypeId ?? undefined,
    };

    try {
      await placeLikesApi.toggle(payload);

      // ✅ 서버 기준으로 다시 동기화
      const metaRes = await placeLikesApi.meta({ contentId: id, userId: uid });

      setLikeCount(metaRes.data.likesCount ?? 0);
      setLiked(!!metaRes.data.liked);

      // ✅ 저장하면서 contentTypeId도 DB에 들어갈 수 있으니 동기화
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

  if (loading && !place) {
    return <div className="place-detail-loading">불러오는 중...</div>;
  }

  if (!place) {
    return (
      <div className="place-detail-loading">장소 정보를 불러오지 못했습니다.</div>
    );
  }

  // 태그 뱃지
  const tags =
    Array.isArray(place.tags) && place.tags.length > 0 ? place.tags : ["여행지"];

  const finalTel = place.tel || basePlace?.tel || "";

  /* -------------------------------------------------------
     🔙 뒤로 버튼
  ------------------------------------------------------- */
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
      <SideMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        user={user}
        setUser={setUser}
      />

      <div className="place-detail-page">
        {/* 상단 히어로 이미지 */}
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

        {/* 본문 */}
        <section className="pd-content">
          {/* 액션 버튼 */}
          <div className="pd-actions">
            <button
              className={`pd-btn primary ${liked ? "active" : ""}`}
              onClick={handleToggleLike}
            >
              {liked ? "저장됨 ✔" : "이 장소 저장하기"}
            </button>
          </div>

          {/* 좌측 정보 / 우측 지도 */}
          <div className="pd-main-grid">
            {/* 왼쪽 */}
            <div className="pd-left">
              <section className="pd-section">
                <h2 className="pd-section-title">기본 정보</h2>

                {uiError && <div className="pd-alert">⚠ {uiError}</div>}

                {/* 한 줄 소개 */}
                {oneLine ? (
                  <p className="pd-one-line">{oneLine}</p>
                ) : (
                  <p className="pd-one-line pd-one-line-dim">
                    상세 설명이 아직 준비되지 않은 장소예요.
                  </p>
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
                    <span className="pd-info-value">
                      {place.address || "주소 정보 없음"}
                    </span>
                  </li>
                  <li>
                    <span className="pd-info-label">전화번호</span>
                    <span className="pd-info-value">
                      {finalTel || "전화번호 정보 없음"}
                    </span>
                  </li>
                  {place.homepage && (
                    <li>
                      <span className="pd-info-label">홈페이지</span>
                      <a
                        href={place.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="pd-info-link"
                      >
                        홈페이지 바로가기 ↗
                      </a>
                    </li>
                  )}
                </ul>
              </section>
            </div>

            {/* 오른쪽 */}
            <div className="pd-right">
              <section className="pd-section">
                <h2 className="pd-section-title">위치</h2>
                <PlaceDetailMap
                  lat={place.mapY || place.latitude}
                  lng={place.mapX || place.longitude}
                  title={place.title}
                />
              </section>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
