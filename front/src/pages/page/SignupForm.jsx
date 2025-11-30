import React, { useState, useRef } from "react";
import { checkEmailDuplicate } from "../pw/PwApi";
import Swal from "sweetalert2";
import "../../styles/page/SignupForm.css";


// Debounce Hook
function useDebounce(callback, delay) {
  const timer = useRef(null);

  return (...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

export default function SignupForm({ setEmail, email, name, setName, password, setPassword }) {
  const [isChecked, setIsChecked] = useState(false);
  const [checking, setChecking] = useState(false);

  // 이메일 입력 변경 시 중복체크 초기화
  const resetCheck = useDebounce(() => {
    setIsChecked(false);
  }, 500);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    resetCheck();
  };

  const handleCheckEmail = async () => {
      setChecking(true);

    if (!email.includes("@")) {
      Swal.fire("오류", "올바른 이메일 형식을 입력하세요.", "error");
      setChecking(false);
      return;
    }

    try {
      const res = await checkEmailDuplicate(email);

      if (res.data.exists) {
        Swal.fire("중복", "이미 사용 중인 이메일입니다.", "error");
        setIsChecked(false);
      } else {
        Swal.fire("성공", "사용 가능한 이메일입니다!", "success");
        setIsChecked(true);
      }
    } catch(err) {

  // 409가 오면 이메일 중복 처리
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
      {/* 이름 */}
      <div className="input-group">
        <label>이름</label>
        <input
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* 이메일 */}
      <div className="email-row">
  <input
    type="email"
    placeholder="이메일을 입력하세요"
    value={email}
    onChange={handleEmailChange}
    className="email-input"
  />

    <button
        type="button"
        onClick={handleCheckEmail}
        disabled={checking}
        className="check-btn"
        style={{ background: isChecked ? "green" : "#fff" }}
    >
        {checking ? "확인중..." : isChecked ? "사용 가능" : "중복 체크"}
      </button>
    </div>

      {/* 비밀번호 */}
      <div className="input-group">
        <label>비밀번호</label>
        <input
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* 최종 회원가입 버튼은 Signup.jsx에서 처리 */}
    </>
  );
} 
