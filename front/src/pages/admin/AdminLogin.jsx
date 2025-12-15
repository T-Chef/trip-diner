import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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

      // ✅ 관리자 토큰 저장
      localStorage.setItem("adminToken", res.data.token);

      toast.success("관리자 로그인 성공");

      // ✅ 반드시 dashboard로 이동
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "관리자 로그인 실패");
    }
  };

  return (
    <div className="admin-login-container">
      <h2>관리자 로그인</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="관리자 이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">로그인</button>
      </form>
    </div>
  );
}
