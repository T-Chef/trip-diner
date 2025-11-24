import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";

export default function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // 로그인 요청
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 간단한 빈값 체크
    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:4000/api/auth/login", {
        email,
        password,
      });

      const user = res.data.user;

      // user 정보 상태 반영
      setUser(user);

      // localStorage 저장 → 새로고침해도 로그인 유지됨
      localStorage.setItem("user", JSON.stringify(user));

      alert(`환영합니다, ${user.name}님!`);

      // 관리자 여부 체크
      if (user.email === "admin@gmail.com") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);

      if (err.response) {
        alert(err.response.data.message);
      } else {
        alert("로그인 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Trip Diner 로그인</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="login-button">
          로그인
        </button>
      </form>

      <button className="signup-btn" onClick={() => navigate("/signup")}>
        회원가입
      </button>
    </div>
  );
}
