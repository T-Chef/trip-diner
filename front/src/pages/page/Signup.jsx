import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import "../../styles/page/Login.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return regex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("모든 항목을 입력해주세요.");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("올바른 이메일 형식이 아닙니다.");
      return;
    }

    try {
      await axios.post("http://localhost:4000/api/auth/register", {
        name,
        email,
        password,
      });

      toast.success("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (err) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Trip Diner 회원가입</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>이름</label>
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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

          <button type="submit" className="login-btn">
            회원가입
          </button>
        </form>

        <div className="login-footer">
          <span className="link" onClick={() => navigate("/login")}>
            로그인 페이지로 이동
          </span>
        </div>
      </div>
    </div>
  );
}
