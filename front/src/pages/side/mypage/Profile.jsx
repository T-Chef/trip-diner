import React from "react";
import { useNavigate } from "react-router-dom";

// CSS
import "../../../styles/side/mypage/Profile.css";

// 아이콘
import {
  FaUserCircle,
  FaStar,
  FaCalendarAlt,
  FaComments,
  FaQuestion,
} from "react-icons/fa";

// 캘린더 컴포넌트
import CalendarBox from "./Calendar.jsx";

export default function Profile({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="profile-wrapper">
      {/* LEFT AREA */}
      <div className="profile-left">
        {/* 프로필 아이콘 */}
        <div
          className="profile-icon clickable"
          onClick={() => navigate("/profile/edit")}
        >
          <FaUserCircle />
        </div>

        <div className="profile-welcome">반가워요</div>
        <div className="profile-name">{user?.name || "사용자"}님.</div>

        {/* 닉네임 변경 / 로그아웃 / 회원탈퇴 */}
        <div className="profile-links">
          <span onClick={() => navigate("/profile/edit")}>닉네임 변경</span>
          <span onClick={handleLogout}>로그아웃</span>
          <span onClick={() => navigate("/withdraw")}>회원 탈퇴</span>
        </div>

        {/* ICON MENU */}
        <div className="profile-menu-icons">
          <div
            className="icon-box clickable"
            onClick={() => navigate("/favorites")}
          >
            <FaStar />
            <p>즐겨찾기</p>
          </div>

          <div
            className="icon-box clickable"
            onClick={() => navigate("/schedule")}
          >
            <FaCalendarAlt />
            <p>일정</p>
          </div>

          <div className="icon-box clickable" onClick={() => navigate("/qna")}>
            <FaQuestion />
            <p>Q&A</p>
          </div>

          <div
            className="icon-box clickable"
            onClick={() => navigate("/reviews")}
          >
            <FaComments />
            <p>후기</p>
          </div>
        </div>
      </div>

      {/* RIGHT AREA */}
      <div className="profile-right">
        <div className="profile-calendar-section">
          <div className="calendar-header">
            <h2>2025년 11월</h2>
            <FaCalendarAlt className="calendar-icon" />
          </div>

          <div className="calendar-box">
            <CalendarBox />
          </div>
        </div>

        {/* GRID MENU */}
        <div className="profile-grid">
          <div
            className="grid-item clickable"
            onClick={() => navigate("/recent")}
          >
            ➡ 최근 본 여행지
          </div>

          <div
            className="grid-item clickable"
            onClick={() => navigate("/city")}
          >
            ➡ 도시 별 여행정보
          </div>

          <div
            className="grid-item clickable"
            onClick={() => navigate("/board")}
          >
            ➡ 게시판
          </div>

          <div
            className="grid-item clickable"
            onClick={() => navigate("/wishlist")}
          >
            ➡ 찜한 여행지
          </div>
        </div>
      </div>
    </div>
  );
}
