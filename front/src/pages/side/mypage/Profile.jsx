import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/Profile.css";

import { FaStar, FaCalendarAlt, FaComments, FaQuestion } from "react-icons/fa";
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

  // 이미지 클릭
  const handleProfileClick = () => {
    fileInputRef.current.click();
  };

  // 이미지 업로드
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

    // 절대경로로 변경
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

        <div className="profile-info">
          <h2>
            반가워요, <span className="highlight">{user.name}님</span>
          </h2>

          <div className="profile-buttons">
            <button onClick={() => navigate("/profile/edit")}>
              닉네임 변경
            </button>
            <button onClick={() => navigate("/login")}>로그아웃</button>
            <button onClick={() => navigate("/withdraw")}>탈퇴</button>
          </div>
        </div>
      </div>

      <div className="profile-calendar-section">
        <div className="calendar-header">
          <h3>2025년 11월</h3>
          <FaCalendarAlt size={28} />
        </div>
        <div className="calendar-box">
          <CalendarBox />
        </div>
      </div>

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
