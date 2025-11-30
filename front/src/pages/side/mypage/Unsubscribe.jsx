import React from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/Unsubscribe.css";

export default function Withdraw({ setUser }) {
  const navigate = useNavigate();

  const handleWithdraw = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <div className="withdraw-wrapper">
      <h2>회원 탈퇴</h2>

      <p>정말 탈퇴하시겠습니까?</p>

      <button className="withdraw-btn" onClick={handleWithdraw}>
        네, 탈퇴합니다
      </button>

      <button className="cancel-btn" onClick={() => navigate("/profile")}>
        돌아가기
      </button>
    </div>
  );
}
