// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/page/Signup.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  // 이메일 유효성 체크 함수
  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 기본 유효성 체크
    if (!name || !email || !password) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      alert("올바른 이메일 형식이 아닙니다.");
      return;
    }

    // ⭐ 비밀번호 길이 제한 제거됨!
    // 기존 4자리 계정도 그대로 허용됨

    try {
      const res = await axios.post("http://localhost:4000/api/auth/register", {
        name,
        email,
        password,
      });

      alert("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (err) {
      console.error(err);

      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Trip Diner 회원가입</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="signup-btn">
          회원가입
        </button>
      </form>

      <button className="back-btn" onClick={() => navigate("/login")}>
        로그인 페이지로 돌아가기
      </button>
    </div>
  );
}
