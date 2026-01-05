import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/Profile.css";

import {
  FaHome,
  FaCalendarCheck,
  FaHeadset,
  FaThumbsUp,
  FaHeart,
  FaRegCommentDots,
  FaRegEdit,
} from "react-icons/fa";

import CalendarBox from "./Calendar";
import api from "../../page/login/api";

/* ================== 다가오는 여행 리스트 ================== */
function UpcomingTrips() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/plan/my");
        if (!res.data?.success) return;

        const today = new Date();

        const upcoming = (res.data.plans || [])
          .filter((p) => new Date(p.start_date) >= today)
          .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
          .slice(0, 4);

        setPlans(upcoming);
      } catch (e) {
        console.error("다가오는 여행 불러오기 실패", e);
      }
    };

    load();
  }, []);

  if (plans.length === 0) {
    return <div className="empty-box">다가오는 여행이 없습니다.</div>;
  }

  return (
    <div className="upcoming-grid">
      {plans.map((p) => {
        const img =
          p.plan_day?.[0]?.plan_item?.[0]?.place?.image_url ||
          "/assets/images/default-placeholder.jpg";

        return (
          <div
            key={p.plan_id}
            className="upcoming-trip-box"
            onClick={() => navigate(`/trip/summary?planId=${p.plan_id}`)}
          >
            <img src={img} alt="" className="upcoming-img" />

            <div className="upcoming-text">
              <div className="upcoming-name">{p.title || "여행 일정"}</div>
              <div className="upcoming-date">
                {p.start_date?.slice(0, 10)} ~ {p.end_date?.slice(0, 10)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================== PROFILE ================== */
export default function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profileImg, setProfileImg] = useState("");

  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUser(parsed);
        } catch (e) {
          console.error("저장된 유저 파싱 실패", e);
        }
      }
    }
  }, [user, setUser]);

  useEffect(() => {
    if (!user?.profile_img) return;

    const finalUrl = user.profile_img.startsWith("http")
      ? user.profile_img
      : `http://localhost:4000${user.profile_img}`;

    setProfileImg(finalUrl);
  }, [user]);

  const handleProfileClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    try {
      const formData = new FormData();
      formData.append("profile", file);
      formData.append("userId", user.user_id);

      const res = await fetch("http://localhost:4000/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        alert("업로드 실패");
        return;
      }

      const fullUrl = `http://localhost:4000${data.imageUrl}`;
      setProfileImg(fullUrl);

      const updatedUser = {
        ...user,
        profile_img: fullUrl,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
      alert("프로필 이미지 업로드 중 오류가 발생했습니다.");
    }
  };

  if (!user) return <>로그인이 필요합니다.</>;

  return (
    <div className="profile-container-new">
      <div className="profile-card">
        <div className="profile-left">
          <div className="profile-photo-box" onClick={handleFileChange}>
            <img
              src={profileImg || "http://localhost:4000/profile.png"}
              className="profile-photo"
              alt="profile"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="profile-info">
            <h2>
              반가워요, <span className="highlight">{user.name}님</span>
            </h2>

            <div className="profile-buttons">
              <button onClick={() => navigate("/profile/edit")}>
                프로필 수정
              </button>
              <button onClick={() => navigate("/profile/edit")}>
                닉네임 수정
              </button>
            </div>
          </div>
        </div>

        <div className="profile-right-menu">
          <div className="menu-box" onClick={() => navigate("/")}>
            <FaHome className="menu-icon" />
            <span>홈으로</span>
          </div>

          <div className="menu-box" onClick={() => navigate("/my-trips")}>
            <FaCalendarCheck className="menu-icon" />
            <span>내 일정</span>
          </div>

          <div className="menu-box" onClick={() => navigate("/mypage/qna")}>
            <FaHeadset className="menu-icon" />
            <span>내 문의</span>
          </div>
        </div>
      </div>

      <div className="profile-calendar-row">
        <div className="profile-trips-panel">
          <div className="panel-header">
            <div className="panel-top">
              <h3>다가오는 여행</h3>
              <button
                className="more-btn"
                onClick={() => navigate("/my-trips")}
              >
                전체보기
              </button>
            </div>
            <span className="panel-sub">
              가까운 여행 일정 최대 4개까지 보여드려요.
            </span>
          </div>

          <UpcomingTrips />
        </div>

        <div className="profile-calendar-section-new">
          <div className="calendar-title">
            <h3>내 여행 일정</h3>
            <span className="calendar-sub">
              달력에서 여행 일정을 한눈에 확인해 보세요.
            </span>
          </div>

          <div className="calendar-wrapper">
            <CalendarBox />
          </div>
        </div>
      </div>

      <div className="profile-grid-new">
        <div className="grid-item" onClick={() => navigate("/like/posts")}>
          <FaThumbsUp /> 좋아요 한 게시글
        </div>

        <div className="grid-item" onClick={() => navigate("/like/places")}>
          <FaHeart /> 좋아요 한 여행지
        </div>

        <div className="grid-item" onClick={() => navigate("/my/posts")}>
          <FaRegEdit /> 내가 쓴 게시글
        </div>

        <div className="grid-item" onClick={() => navigate("/my/comments")}>
          <FaRegCommentDots /> 내가 쓴 댓글
        </div>
      </div>
    </div>
  );
}
