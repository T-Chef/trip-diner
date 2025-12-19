// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/AdminUsers.css";

const API_BASE = "http://localhost:4000/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    // 🔴 1. 토큰 자체가 없으면 즉시 차단
    if (!token || token === "null" || token === "undefined") {
      toast.error("관리자 인증이 필요합니다. 다시 로그인하세요.");
      navigate("/admin/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        // 🔎 2. 실제로 어떤 토큰이 날아가는지 확인
        console.log("📌 adminToken (프론트):", token);

        const res = await axios.get(`${API_BASE}/admin/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUsers(res.data);
      } catch (err) {
        console.error("❌ 유저 목록 조회 실패:", err.response);

        // 🔥 3. 인증 에러면 강제 로그아웃
        if (err.response?.status === 401) {
          toast.error("관리자 인증이 만료되었습니다. 다시 로그인하세요.");
          localStorage.removeItem("adminToken");
          navigate("/admin/login");
        } else {
          toast.error("유저 목록을 불러오지 못했습니다.");
        }
      }
    };

    fetchUsers();
  }, [token, navigate]);

  const updateUserStatus = async (
    userId,
    deletedValue,
    successMsg,
    failMsg
  ) => {
    try {
      const url =
        deletedValue === 1
          ? `${API_BASE}/admin/users/${userId}/deactivate`
          : `${API_BASE}/admin/users/${userId}/activate`;

      console.log("📌 상태 변경 요청:", url);

      await axios.patch(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, deleted: deletedValue } : u
        )
      );

      toast.success(successMsg);
    } catch (err) {
      console.error("❌ 상태 변경 실패:", err.response);
      toast.error(failMsg);
    }
  };

  const deactivateUser = (userId) => {
    if (!window.confirm("해당 유저를 비활성화하시겠습니까?")) return;
    updateUserStatus(userId, 1, "비활성화 완료", "비활성화 실패");
  };

  const activateUser = (userId) => {
    if (!window.confirm("해당 유저를 활성화하시겠습니까?")) return;
    updateUserStatus(userId, 0, "활성화 완료", "활성화 실패");
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">회원 관리</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>이메일</th>
            <th>이름</th>
            <th>상태</th>
            <th>관리</th>
          </tr>
        </thead>

        <tbody>
          {users.map((u) => (
            <tr key={u.user_id} className={u.deleted ? "user-disabled" : ""}>
              <td>{u.user_id}</td>
              <td>{u.email}</td>
              <td>{u.name || "-"}</td>
              <td>
                {u.deleted ? (
                  <span className="status disabled">비활성</span>
                ) : (
                  <span className="status active">활성</span>
                )}
              </td>
              <td>
                {u.deleted ? (
                  <button
                    className="activate-btn"
                    onClick={() => activateUser(u.user_id)}
                  >
                    ✔ 활성화
                  </button>
                ) : (
                  <button
                    className="delete-btn"
                    onClick={() => deactivateUser(u.user_id)}
                  >
                    ⛔ 비활성화
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
