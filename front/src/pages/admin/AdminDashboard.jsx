import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import "../../styles/admin/AdminDashboard.css";

const API_BASE = "/api";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  // 관리자 인증 체크 + 유저 목록 로드
  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    axios
      .get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch(() => {
        toast.error("관리자 인증이 만료되었습니다.");
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      });
  }, [token, navigate]);

  // 🔒 유저 비활성화
  const handleDeactivate = async (userId) => {
    if (!window.confirm("해당 유저를 비활성화하시겠습니까?")) return;

    try {
      await axios.patch(
        `${API_BASE}/admin/users/${userId}/deactivate`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("유저가 비활성화되었습니다.");

      // 상태만 갱신 (삭제 ❌)
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, deleted: 1 } : u))
      );
    } catch {
      toast.error("유저 비활성화 실패");
    }
  };

  return (
    <div className="admin-container">
      <h2 className="admin-title">관리자 대시보드</h2>

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
                <button
                  className="delete-btn"
                  disabled={u.deleted}
                  onClick={() => handleDeactivate(u.user_id)}
                >
                  비활성화
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
