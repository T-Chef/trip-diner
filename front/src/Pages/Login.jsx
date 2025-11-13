import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Login.css";
function Login({ setUser, dummyUsers }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    // 이메일로 사용자 검색
    const foundUser = dummyUsers.find((user) => user.email === email);
    // 이메일 존재 여부 확인
    if (!foundUser) {
      alert("등록되지 않은 회원입니다.");
      return;
    }
    // 비밀번호 확인
    if (foundUser.password !== password) {
      alert("비밀번호가 올바르지 않습니다.");
      return;
    }
    // :white_check_mark: 로그인 성공 시
    setUser(foundUser);
    if (foundUser.email === "admin@gmail.com") {
      alert("관리자 계정으로 로그인했습니다.");
      navigate("/admin"); // 관리자 페이지 이동
    } else {
      alert(`환영합니다, ${foundUser.name}님!`);
      navigate("/"); // 일반 사용자 홈 이동
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
      <button
        className="signup-btn"
        onClick={() => navigate("/signup")}
      >
        회원가입
      </button>
    </div>
  );
}
export default Login;