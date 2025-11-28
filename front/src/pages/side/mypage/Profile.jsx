import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/Profile.css";

import {
  FaStar,
  FaCalendarAlt,
  FaComments,
  FaQuestion,
  FaRegHeart,
  FaRegCalendarCheck,
  FaRegQuestionCircle,
  FaRegCommentDots,
} from "react-icons/fa";

import CalendarBox from "./Calendar";

export default function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profileImg, setProfileImg] = useState("");

  useEffect(() => {
    if (!user?.profile_img) return;

    const fullUrl = `http://localhost:4000${user.profile_img}`;
    console.log("초기 로딩 URL:", fullUrl);

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

        {/* 4가지 항목(수정 예정) */}
        <div className="profile-right-menu">
          <div className="menu-box" onClick={() => navigate("/wishlist")}>
            <FaRegHeart className="menu-icon" />
            <span>즐겨찾기</span>
          </div>

          <div className="menu-box" onClick={() => navigate("/schedule")}>
            <FaRegCalendarCheck className="menu-icon" />
            <span>일정</span>
          </div>

          <div className="menu-box" onClick={() => navigate("/qna")}>
            <FaRegQuestionCircle className="menu-icon" />
            <span>Q&A</span>
          </div>

          <div className="menu-box" onClick={() => navigate("/review")}>
            <FaRegCommentDots className="menu-icon" />
            <span>후기</span>
          </div>
        </div>
      </div>

      {/* 달력 */}
      <div className="profile-calendar-section">
        <div className="calendar-header">
          <h3>2025년 11월</h3>
          <FaCalendarAlt size={28} />
        </div>
        <div className="calendar-box">
          <CalendarBox />
        </div>
      </div>

      {/* 최근 본 여행지, 도시 정보, 게시판, 찜한 여행지 */}
      <div className="profile-grid">
        <div className="grid-item" onClick={() => navigate("/recent")}>
          <FaCalendarAlt /> 최근 본 여행지
        </div>

        <div className="grid-item" onClick={() => navigate("/city")}>
          <FaStar /> 도시 정보
        </div>

        <div className="grid-item" onClick={() => navigate("/board")}>
          <FaComments /> 게시판
        </div>

        <div className="grid-item" onClick={() => navigate("/wishlist")}>
          <FaQuestion /> 찜한 여행지
        </div>
      </div>
    </div>
  );
}
