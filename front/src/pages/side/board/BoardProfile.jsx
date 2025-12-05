import React, { useRef, useState, useEffect } from "react";
import "../../../styles/side/board/Board.css";


export default function BoardProfile({ user, setUser }) {
  const fileInputRef = useRef(null);
  const [profileImg, setProfileImg] = useState("");

  // 초기 유저 사진 불러오기
  useEffect(() => {
    if (user?.profile_img) {
      const fullUrl = `http://localhost:4000${user.profile_img}`;
      setProfileImg(fullUrl);
    }
  }, [user]);

  // 사진 클릭 → 파일 열기
  const handleProfileClick = () => {
    fileInputRef.current.click();
  };

  // 사진 변경 처리
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile", file);
    formData.append("userId", user.user_id);

    const res = await fetch("http://localhost:4000/api/profile/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.success) {
      alert("업로드 실패");
      return;
    }

    const fullUrl = `http://localhost:4000${data.imageUrl}`;
    setProfileImg(fullUrl);

    const updatedUser = { ...user, profile_img: data.imageUrl };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <div className="profile-box" onClick={handleProfileClick}>
      <img
        src={profileImg || "http://localhost:4000/profile.png"}
        alt="profile"
        className="profile-img"
      />

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div className="profile-name">{user?.name}님</div>
      <p className="welcome-text">환영합니다! {user?.name}님 😊</p>
    </div>
  );
}
