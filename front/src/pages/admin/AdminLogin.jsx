import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminLogin({ setAdmin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:4000/api/admin/login", {
        email,
        password,
      });

      toast.success("관리자 로그인 성공!");

      const adminInfo = res.data.admin;
      const token = res.data.token;

      localStorage.setItem("admin", JSON.stringify(adminInfo));
      localStorage.setItem("adminToken", token);

      setAdmin(adminInfo);

      window.location.href = "/admin"; // 관리자 페이지로 이동
    } catch (err) {
      toast.error(err.response?.data?.message || "로그인 실패");
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
