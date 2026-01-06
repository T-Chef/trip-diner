import React, { useState } from "react";
import { resetPassword } from "./PwApi.js";
import { useSearchParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../../styles/page/Login.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");

  const bgStyle = {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/assets/images/login.png')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 0",
  };

  const handleReset = async () => {
    if (!token) {
      Swal.fire(
        "오류",
        "유효하지 않은 접근입니다. 다시 메일을 요청해주세요.",
        "error"
      );
      return;
    }

    if (!password) {
      Swal.fire("알림", "새로운 비밀번호를 입력해주세요.", "info");
      return;
    }

    try {
      const res = await resetPassword(token, password);

      if (res.data.success) {
        Swal.fire({
          title: "변경 완료",
          text: "비밀번호가 성공적으로 변경되었습니다.",
          icon: "success",
          confirmButtonText: "로그인하러 가기",
        }).then(() => {
          navigate("/login");
        });
      } else {
        Swal.fire(
          "오류",
          res.data.message || "비밀번호 변경에 실패했습니다.",
          "error"
        );
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "링크가 만료되었거나 서버 오류가 발생했습니다.";
      Swal.fire("오류", errorMsg, "error");
    }
  };

  return (
    <div className="login-container" style={bgStyle}>
      <div className="login-box">
        <h2 className="login-title">새 비밀번호 설정</h2>

        <p
          style={{
            fontSize: "14px",
            color: "#666",
            marginBottom: "25px",
            textAlign: "center",
            lineHeight: "1.5",
          }}
        >
          새롭게 사용할 비밀번호를
          <br />
          안전하게 입력해주세요.
        </p>

        <div className="input-group">
          <label>새 비밀번호</label>
          <input
            type="password"
            placeholder="새 비밀번호 입력"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
        </div>

        <button
          onClick={handleReset}
          className="login-btn"
          style={{ marginTop: "15px" }}
        >
          비밀번호 변경
        </button>

        <div className="login-footer">
          <span className="link" onClick={() => navigate("/login")}>
            취소하고 돌아가기
          </span>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
