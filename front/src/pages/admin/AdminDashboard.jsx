import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    axios
      .get("http://localhost:4000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUsers(res.data));
  }, []);

  return (
    <div>
      <h2>관리자 대시보드</h2>

      {users.map((u) => (
        <div key={u.user_id}>
          {u.email} / {u.name}
        </div>
      ))}
    </div>
  );
}
