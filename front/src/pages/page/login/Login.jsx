import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { login } from "../../../api/authApi";
import { setAuth } from "../../../utils/authStorage";
import "../../../styles/page/Login.css";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation(); 

  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await login(email, password);
      const user = res.data.user;
      const accessToken = res.data.accessToken;

      setUser(user);
      setAuth({ accessToken, user });

      toast.success(res.data.message || "로그인 성공");

      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "로그인 중 오류가 발생했습니다.";
      toast.error(msg);
    }
  };

  return (
    <div className="login-container">
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
            />
          </div>

          <div className="input-group">
            <label>비밀번호</label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
