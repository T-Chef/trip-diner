import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Login.css";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 백엔드(4000번) 로그인 요청
      const res = await axios.post("http://localhost:4000/api/auth/login", {
        email,
        password,
      });

      const user = res.data.user;

      // 로그인 성공
      alert(`환영합니다, ${user.username}님!`);
      setUser(user);

      // 관리자 이메일인지 체크 (옵션)
      if (user.email === "admin@gmail.com") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);

      // 백엔드에서 온 에러 메시지 출력
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

export default Login;
