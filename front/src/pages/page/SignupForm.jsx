import React, { useState, useRef } from "react";
import { checkEmailDuplicate } from "../pw/PwApi";
import Swal from "sweetalert2";

export default function SignupForm({
  setEmail,
  email,
  name,
  setName,
  password,
  setPassword,
}) {
  const [isChecked, setIsChecked] = useState(false);
  const [checking, setChecking] = useState(false);

  const timer = useRef(null);

  const resetCheck = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setIsChecked(false);
    }, 500);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    resetCheck();
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      Swal.fire("입력 필요", "이메일을 입력해 주세요.", "warning");
      return;
    }

    if (!email.includes("@")) {
      Swal.fire("오류", "올바른 이메일 형식을 입력하세요.", "error");
      return;
    }

    setChecking(true);
    try {
      const res = await checkEmailDuplicate(email);

      if (res.data.exists) {
        Swal.fire("중복", "이미 사용 중인 이메일입니다.", "error");
        setIsChecked(false);
      } else {
        Swal.fire("성공", "사용 가능한 이메일입니다!", "success");
        setIsChecked(true);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        Swal.fire("중복", "이미 사용 중인 이메일입니다.", "error");
      } else {
        Swal.fire("오류", "서버 오류가 발생했습니다.", "error");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <div className="input-group">
        <label>이름</label>
        <input
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>이메일</label>
        <div
          style={{
            display: "flex",
            gap: "10px",
            width: "100%",
            alignItems: "center",
          }}
        >
          {" "}
          <input
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={handleEmailChange}
            className="email-input"
            style={{ flex: 1, width: "auto" }}
          />
          <button
            type="button"
            onClick={handleCheckEmail}
            disabled={checking}
            className="check-btn"
            style={{
              width: "100px",
              height: "48px",
              backgroundColor: isChecked ? "#28a745" : "#8d7456",
              borderRadius: "10px",
              border: "none",
              color: "white",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {checking ? "확인중..." : isChecked ? "사용 가능" : "중복 체크"}
          </button>
        </div>
      </div>
      <div className="input-group">
        <label>비밀번호</label>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
    </>
  );
}
