import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/ProfileEdit.css";

export default function ProfileEdit({ user, setUser }) {
  const [nickname, setNickname] = useState(user?.name || "");
  const navigate = useNavigate();

  const handleSave = () => {
    const updatedUser = { ...user, name: nickname };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    navigate("/profile");
  };

  return (
    <div className="edit-wrapper">
      <h2>프로필 수정</h2>

      <label>닉네임</label>
      <input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <button className="save-btn" onClick={handleSave}>
        저장하기
      </button>

      <button className="back-btn" onClick={() => navigate("/profile")}>
        돌아가기
      </button>
    </div>
  );
}
