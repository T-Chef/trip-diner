import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "../../styles/page/Login.css"; // ★ 회원 로그인 CSS 그대로 재사용

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:4000/api/admin/login", {
        email,
        password,
      });

      localStorage.setItem("adminToken", res.data.token);

      toast.success("관리자 로그인 성공");

      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "관리자 로그인 실패");
    }
  };

  const bgStyle = {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)),
       url('/assets/images/login.png')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  };

  return (
    <div className="login-container" style={bgStyle}>
      <div className="login-box">
        <h2 className="login-title">관리자 로그인</h2>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>관리자 이메일</label>
            <input
              type="email"
              placeholder="관리자 이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn">
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
