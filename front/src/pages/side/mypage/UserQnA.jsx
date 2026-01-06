// src/pages/side/mypage/UserQnA.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import SideMenu from "../../../components/home/SideMenu";

import "../../../styles/page/home/Header.css";
import "../../../styles/side/mypage/UserQnA.css";

export default function UserQnA() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const savedUser = localStorage.getItem("user");
  const [user, setUser] = useState(savedUser ? JSON.parse(savedUser) : null);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      await axios.post(
        "http://localhost:4000/api/qna",
        { title, content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("문의가 등록되었습니다.");
      window.location.href = "/mypage/qna";
    } catch (err) {
      console.error("문의 등록 오류:", err);
      alert("문의 등록 실패");
    }
  };

  const bgStyle = {
    minHeight: "100vh",
    backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)),
      url(${process.env.PUBLIC_URL}/assets/images/trip-bg.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="layout-wrapper">
      <QnaHeader setMenuOpen={setMenuOpen} />

      <SideMenu
        user={user}
        setUser={setUser}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      <div
        className={`overlay ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
      />

      <div className="qna-write-wrapper" style={bgStyle}>
        <div className="qna-write-card">
          <h2 className="qna-write-title">문의하기</h2>

          <p className="qna-write-sub">
            궁금한 점이 있으신가요? 언제든 편하게 남겨주세요.
          </p>

          <input
            className="qna-input"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            className="qna-textarea"
            placeholder="문의 내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button className="qna-submit-btn" onClick={handleSubmit}>
            문의 등록
          </button>
        </div>
      </div>
    </div>
  );
}

function QnaHeader({ setMenuOpen }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`header ${scrolled ? "header--scrolled" : ""}`}
      aria-label="Site header"
    >
      <div className="header-inner">
        <Link to="/" className="logo" aria-label="Trip Diner 홈">
          <img
            className="logo-img"
            src="/assets/textures/logo.jpg"
            alt="Trip Diner"
          />
        </Link>

        <button
          className="menu-btn"
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <img
            className="menu-icon-img"
            src="/assets/textures/sidemenu.jpg"
            alt=""
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
