import React, { useState } from "react";
import { requestResetEmail } from "./PwApi.js";
import Swal from "sweetalert2";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSendMail = async () => {
    try {
      const res = await requestResetEmail(email);

      if (res.data.success) {
        Swal.fire("메일 전송 완료", "메일을 확인해주세요.", "success");
      } else {
        Swal.fire("오류", res.data.message, "error");
      }
    } catch (err) {
      Swal.fire("오류", "메일 전송 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <div style={{ width: "300px", margin: "20px auto" }}>
      <h2>비밀번호 재설정 요청</h2>

      <input
        type="email"
        placeholder="가입한 이메일 입력"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <button
        onClick={handleSendMail}
        style={{
          width: "100%",
          padding: "8px",
          background: "#3498db",
          color: "#fff",
        }}
      >
        재설정 메일 보내기
      </button>
    </div>
  );
}

export default ForgotPassword;
