// src/Pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Login.css";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 서버로 회원가입 요청 보내기
      const res = await axios.post("http://localhost:4000/api/auth/register", {
        email: email,
        password: password,
        username: name, // 백엔드가 username으로 받으니까
      });

      alert("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("회원가입 중 오류가 발생했습니다.");
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

export default Signup;
