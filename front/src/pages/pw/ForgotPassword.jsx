import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestResetEmail } from "./PwApi.js";
import Swal from "sweetalert2";
import "../../styles/page/Login.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

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

  const handleSendMail = async () => {
    if (!email) {
      Swal.fire("입력 확인", "이메일을 입력해주세요.", "warning");
      return;
    }

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
    <div className="login-container" style={bgStyle}>
      <div className="login-box">
        <h2 className="login-title">비밀번호 재설정</h2>

        <p
          style={{
            fontSize: "14px",
            color: "#666",
            marginBottom: "20px",
            textAlign: "center",
            lineHeight: "1.5",
          }}
        >
          가입하신 이메일을 입력하시면
          <br />
          재설정 링크를 보내드립니다.
        </p>

        <div className="input-group">
          <label>이메일 주소</label>
          <input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
        </div>

        <button
          onClick={handleSendMail}
          className="login-btn"
          style={{ marginTop: "10px" }}
        >
          재설정 메일 보내기
        </button>

        <div className="login-footer">
          <span className="link" onClick={() => navigate("/login")}>
            로그인 페이지로 돌아가기
          </span>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
