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
    if (!token) {
      toast.error("관리자 인증이 필요합니다.");
      navigate("/admin/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        toast.error("유저 목록을 불러오지 못했습니다.");
      }
    };

    fetchUsers();
  }, [token, navigate]);

  const updateUserStatus = async (userId, deleted) => {
    const url = deleted
      ? `${API_BASE}/admin/users/${userId}/activate`
      : `${API_BASE}/admin/users/${userId}/deactivate`;

    try {
      await axios.patch(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, deleted: deleted ? 0 : 1 } : u
        )
      );

      toast.success(deleted ? "활성화 완료" : "비활성화 완료");
    } catch {
      toast.error("상태 변경 실패");
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">회원 관리</h2>

      <div className="admin-table-wrapper">
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
              <tr key={u.user_id}>
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
                      className="admin-btn activate"
                      onClick={() => updateUserStatus(u.user_id, 1)}
                    >
                      활성화
                    </button>
                  ) : (
                    <button
                      className="admin-btn delete"
                      onClick={() => updateUserStatus(u.user_id, 0)}
                    >
                      비활성화
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
