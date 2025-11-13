import React, { useState } from "react";
import "../Admin.css";

function Admin() {
  const [users, setUsers] = useState([
    { email: "user1@example.com", name: "사용자1" },
    { email: "user2@example.com", name: "사용자2" },
  ]);

  const handleDelete = (index) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-container">
      <h2>관리자 페이지</h2>
      <table className="user-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>이메일</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, idx) => (
            <tr key={idx}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <button className="delete-btn" onClick={() => handleDelete(idx)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Admin;