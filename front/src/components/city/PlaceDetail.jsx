// front/src/components/city/PlaceDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../home/Header";
import SideMenu from "../home/SideMenu";
import PlaceDetailMap from "./PlaceDetailMap";

import "../../styles/page/city/PlaceDetail.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";


export default function PlaceDetail({ user, setUser }) {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search);
  const contentTypeId = query.get("type");

  // 👉 목록에서 넘어온 기본 정보
  const basePlace = location.state?.basePlace || null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [place, setPlace] = useState(basePlace); // 기본값은 basePlace
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ overview 문자열 (목록/상세 중 있는 쪽 사용)
  const rawOverview =
    (place && place.overview) ||
    (basePlace && basePlace.overview) ||
    "";

  // ✅ 한 줄 소개: 기본 정보 박스 위에만 보여줌
  const oneLine =
    rawOverview.length > 0
      ? rawOverview.split(/[\n.]/)[0] // 첫 문장만 사용
      : "";

  // 🔹 상세정보 불러오기
  useEffect(() => {
    if (!id || !contentTypeId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/place/detail`, {
          params: { 
            contentId: id, 
            contentTypeId,
            // 👉 목록에서 넘어온 기본 정보도 같이 보냄 (fallback 용)
            title: basePlace?.title,
            address: basePlace?.address,
            tel: basePlace?.tel,
        },
    });

        const data = res.data;
        
        // noDetail: 공공데이터에 상세가 없을 때
        if (data.noDetail) {
          setPlace((prev) => {
            const merged = {
              ...(prev || {}),
              ...data,
            };

            // 제목/주소/이미지는 목록 정보 우선
            merged.title = prev?.title || data.title;
            merged.address = prev?.address || data.address;
            merged.image = prev?.image || data.image;

            // 좌표도 목록 값 우선
            merged.mapX = prev?.longitude ?? data.mapX;
            merged.mapY = prev?.latitude ?? data.mapY;

            // overview가 비어 있으면 목록에서 가져오기
            if (!data.overview && prev?.overview) {
              merged.overview = prev.overview;
            }

            // 🔹 tel 은 data.tel 이 비어 있으면 이전 값 유지
            if ((!data.tel || data.tel.trim() === "") && prev?.tel) {
              merged.tel = prev.tel;
            }

            return merged;
          });
        } else {
          // 정상 상세라면 그냥 덮어쓰기 + basePlace 정보와 머지
          setPlace((prev) => ({
            ...(prev || {}),
            ...data,
          }));
        }

        if (data.likesCount != null) setLikeCount(data.likesCount);
      } catch (err) {
        console.error("🔴 Place detail load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, contentTypeId]);

  // 🔹 위치(도시명) 추출: "강원특별자치도 춘천시 ..." -> "춘천시"
  const shortLocation = place?.address
    ? place.address.split(" ")[1] || place.address
    : "";

  // 🔥 좋아요 토글
  const handleToggleLike = async () => {
    if (!place) return;

    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => Math.max(0, prev + (newLiked ? 1 : -1)));

    try {
      await axios.post(`${API_BASE}/place/like`, {
        contentId: place.contentId || id,
        liked: newLiked,
        userId: user?.id || 1, // TODO: 실제 로그인 유저 ID로 교체
      });
    } catch (err) {
      console.error("좋아요 저장 실패:", err);
      // 실패 시 롤백
      setLiked(!newLiked);
      setLikeCount((prev) => Math.max(0, prev + (newLiked ? -1 : 1)));
    }
  };

  if (loading && !place) {
    // basePlace도 없고 아직 로딩이면
    return <div className="place-detail-loading">불러오는 중...</div>;
  }

  if (!place) {
    return (
      <div className="place-detail-loading">
        장소 정보를 불러오지 못했습니다.
      </div>
    );
  }

  // ✅ 편의시설(뼈대용) 정의 – 아직 데이터는 없으니 false일 수 있음
  const facilities = [
    { key: "hasParking", label: "주차", icon: "🚗" },
    { key: "hasWifi", label: "와이파이", icon: "📶" },
    { key: "petFriendly", label: "반려동물 동반", icon: "🐶" },
    { key: "takeout", label: "포장", icon: "🥡" },
  ];

  const activeFacilities = facilities.filter(f => place[f.key]);

  // 태그 뼈대 – 나중에 place.tags 넣으면 됨
  const tags = 
    Array.isArray(place.tags) && place.tags.length > 0
    ? place.tags
    : ["여행지"];

  const finalTel = place.tel || basePlace?.tel || "";
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
          <button className="pd-back-btn" onClick={() => navigate(-1)}>
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
                <span className="pd-likes">
                  ❤️ {likeCount.toLocaleString()}명
                </span>
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

            <button
              className="pd-btn"
              onClick={() => {
                alert("일정 추가 기능은 추후 연동 예정입니다 🙂");
              }}
            >
              📅 일정에 추가
            </button>
          </div>

          {/* 좌측 정보 / 우측 지도 */}
          <div className="pd-main-grid">
            {/* 왼쪽: 기본 정보만 */}
            <div className="pd-left">
              <section className="pd-section">
                <h2 className="pd-section-title">기본 정보</h2>

                {/* 한 줄 소개 – 있으면만 노출 */}
                {oneLine && (
                  <p className="pd-one-line">{oneLine}</p>
                )}

                {/* 태그 뱃지 */}
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

                {/* 편의시설 뼈대 */}
                <div className="pd-facility-block">
                  <h3 className="pd-sub-title">편의시설</h3>
                  <div className="pd-badges">
                    {activeFacilities.length > 0 ? (
                      activeFacilities.map((f) => (
                        <span key={f.key} className="pd-badge on">
                          {f.icon} {f.label}
                        </span>
                      ))
                    ) : (
                      <span className="pd-facility-empty">
                        등록된 편의시설 정보가 없어요
                      </span>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* 오른쪽: 지도 */}
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
