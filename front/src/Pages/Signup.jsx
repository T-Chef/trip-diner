// src/Pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../Login.css';

function Signup({ dummyUsers, setDummyUsers }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // 이미 존재하는 이메일인지 확인용
        const existingUser = dummyUsers.find((user) => user.email === email);
        if (existingUser) {
            alert("이미 가입된 이메일입니다!");
            return;
        }
        
        // 새 사용자 추가
        const newUSer = { email, password, name };
        setDummyUsers([...dummyUsers, newUSer]);

        alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다 ^^");
        navigate("/login"); //로그인 페이지로 이동
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

  {/* 회원가입 버튼 */}
  <button type="submit" className="signup-btn">
    회원가입
  </button>
</form>

{/* 로그인 페이지로 돌아가기 버튼 */}
<button
  className="back-btn"   // 
  onClick={() => navigate("/login")}
>
  로그인 페이지로 돌아가기
</button>
    </div>
  );
}

export default Signup;