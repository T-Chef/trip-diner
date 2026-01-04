import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "./api";
import "../../../styles/page/Login.css";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      const user = res.data.user;
      const accessToken = res.data.accessToken;
      localStorage.setItem("accessToken", accessToken);

      const normalizedUser = {
        ...user,
        profile_img: user?.profile_img
          ? `http://localhost:4000${user.profile_img}`
          : null,
      };

      toast.success(`환영합니다, ${normalizedUser.name}님!`);
      setUser(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      if (normalizedUser.email === "admin@gmail.com") {
        navigate("/admin", { state: { justLoggedIn: true } });
      } else {
        navigate("/", { state: { justLoggedIn: true } });
      }
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data.message);
      } else {
        toast.error("로그인 중 오류가 발생했습니다.");
      }
    }
  };

  // 배경 이미지 경로 설정 (public 폴더 기준)
  const bgStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/assets/images/login.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="login-container" style={bgStyle}>
      <div className="login-box">
        <h2 className="login-title">Trip Diner 로그인</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>이메일</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요"
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

          <div className="forgot-area">
            <a href="/forgot-password" className="forgot-link">
              비밀번호를 잊어버리셨나요?
            </a>
          </div>

          <button type="submit" className="login-btn">
            로그인
          </button>
        </form>

        <div className="login-footer">
          아직 계정이 없으신가요?
          <span
            className="link"
            onClick={() => navigate("/signup")}
            style={{ marginLeft: "5px" }}
          >
            회원가입
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;