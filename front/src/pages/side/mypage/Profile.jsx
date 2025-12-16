import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/Profile.css";

import {
  FaHome,
  FaCalendarCheck,
  FaHeadset,
  FaThumbsUp,
  FaHeart,
} from "react-icons/fa";

import CalendarBox from "./Calendar";

export default function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profileImg, setProfileImg] = useState("");

  /* -----------------------------------------
     프로필 이미지 세팅 (로그인 후 / 새로고침)
     절대경로인지, 상대경로인지 자동판별해서 처리
  ------------------------------------------*/
  useEffect(() => {
    if (!user?.profile_img) return;

    const finalUrl = user.profile_img.startsWith("http")
      ? user.profile_img
      : `http://localhost:4000${user.profile_img}`;

    setProfileImg(finalUrl);
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

    // 서버가 주는 값: /uploads/파일명
    const fullUrl = `http://localhost:4000${data.imageUrl}`;

    // 프론트 표시 이미지 교체
    setProfileImg(fullUrl);

    // user 객체에 절대경로 형태로 저장하여 Refresh 후에도 유지되도록
    const updatedUser = {
      ...user,
      profile_img: fullUrl,
    };

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
          <div className="menu-box" onClick={() => navigate("/")}>
            <FaHome className="menu-icon" />
            <span>홈으로</span>
          </div>

          <div className="menu-box" onClick={() => navigate("/schedule")}>
            <FaCalendarCheck className="menu-icon" />
            <span>내 일정</span>
          </div>

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
        <div className="grid-item" onClick={() => navigate("/Like/Posts")}>
          <FaThumbsUp /> 좋아요 한 게시글
        </div>

        <div className="grid-item" onClick={() => navigate("/Like/Places")}>
          <FaHeart /> 좋아요 한 여행지
        </div>
      </div>
    </div>
  );
}