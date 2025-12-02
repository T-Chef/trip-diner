import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/Profile.css";

import {
  FaHome,
  FaCalendarCheck,
  FaHeadset,
  FaThumbsUp,
  FaHeart
} from "react-icons/fa";

import CalendarBox from "./Calendar";

export default function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profileImg, setProfileImg] = useState("");

  useEffect(() => {
    if (!user?.profile_img) return;

    const fullUrl = `http://localhost:4000${user.profile_img}`;
    setProfileImg(fullUrl);
  }, [user]);

  // 프로필 클릭
  const handleProfileClick = () => {
    fileInputRef.current.click();
  };

  // 프로필 업로드
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

    const updatedUser = { ...user, profile_img: data.imageUrl };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  if (!user) return <>로그인이 필요합니다.</>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        {/* 프로필 */}
        <div className="profile-photo-box" onClick={handleProfileClick}>
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

        {/* 인사말 + 버튼 */}
        <div className="profile-info">
          <h2>
            반가워요, <span className="highlight">{user.name}님</span>
          </h2>

          <div className="profile-buttons">
            <button onClick={() => navigate("/profile/edit")}>
              닉네임 변경
            </button>
            <button onClick={() => navigate("/login")}>로그아웃</button>
            <button onClick={() => navigate("/withdraw")}>회원탈퇴</button>
          </div>
        </div>

        {/* 오른쪽 메뉴 */}
        <div className="profile-right-menu">
          {/* 홈으로 */}
          <div className="menu-box" onClick={() => navigate("/")}>
            <FaHome className="menu-icon" />
            <span>홈으로</span>
          </div>

          {/* 내 일정 */}
          <div className="menu-box" onClick={() => navigate("/schedule")}>
            <FaCalendarCheck className="menu-icon" />
            <span>내 일정</span>
          </div>

          {/* 문의하기 */}
          <div className="menu-box" onClick={() => navigate("/contract")}>
            <FaHeadset className="menu-icon" />
            <span>문의하기</span>
          </div>
        </div>
      </div>

      {/* 달력 */}
      <div className="profile-calendar-section">
        <div className="calendar-header">
          <h3>2025년 11월</h3>
          <FaCalendarCheck size={28} />
        </div>
        <div className="calendar-box">
          <CalendarBox />
        </div>
      </div>

      {/* 그리드 메뉴 */}
      <div className="profile-grid">
        {/* 좋아요 한 게시글 */}
        <div className="grid-item" onClick={() => navigate("/Favorites/Page")}>
          <FaThumbsUp /> 좋아요 한 게시글
        </div>

        {/* 좋아요 한 여행지 */}
        <div className="grid-item" onClick={() => navigate("/Favorites/City")}>
          <FaHeart /> 좋아요 한 여행지
        </div>
      </div>
    </div>
  );
}
