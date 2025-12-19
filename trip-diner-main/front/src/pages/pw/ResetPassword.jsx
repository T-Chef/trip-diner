import React, { useState } from "react";
import { resetPassword } from "./PwApi.js";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");

  const handleReset = async () => {
    try {
      const res = await resetPassword(token, password);

      if (res.data.success) {
        Swal.fire("완료", "비밀번호가 변경되었습니다.", "success");
      } else {
        Swal.fire("오류", res.data.message, "error");
      }
    } catch (err) {
      Swal.fire("오류", "문제가 발생했습니다.", "error");
    }
  };

  return (
    <div style={{ width: "300px", margin: "20px auto" }}>
      <h2>새 비밀번호 설정</h2>

      <input
        type="password"
        placeholder="새 비밀번호 입력"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
      />

      <button
        onClick={handleReset}
        style={{
          width: "100%",
          padding: "8px",
          background: "#2ecc71",
          color: "#fff",
        }}
      >
        비밀번호 변경
      </button>
    </div>
  );
}

export default ResetPassword;
