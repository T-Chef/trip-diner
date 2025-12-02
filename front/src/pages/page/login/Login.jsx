import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import "../../../styles/page/Login.css";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:4000/api/auth/login", {
        email,
        password,
      });

      const user = res.data.user;

      toast.success(`환영합니다, ${user.name}님!`);

      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.email === "admin@gmail.com") {
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

<<<<<<< HEAD
=======
          <div className="forgot-area">
            <a href="/forgot-password" className="forgot-link">
              비밀번호를 잊어버리셨나요?
            </a>
          </div>


>>>>>>> 14b263672d987f40ed0bbf071335dd8a6db9f247
          <button type="submit" className="login-btn">
            로그인
          </button>
        </form>

        {/* 🔥 클릭 영역 분리 */}
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

<<<<<<< HEAD
export default Login;
=======
export default Login;
>>>>>>> 14b263672d987f40ed0bbf071335dd8a6db9f247
