import { useState } from "react";
import axios from "axios";
import "../../../styles/side/mypage/UserQnA.css";

export default function UserQnA() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      await axios.post(
        "http://localhost:4000/api/qna",
        { title, content },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("문의가 등록되었습니다.");
      window.location.href = "/mypage/qna";
    } catch (err) {
      console.error("문의 등록 오류:", err);
      alert("문의 등록 실패");
    }
  };

  // ⭐ public 이미지 배경 적용 (정석 + 100% 동작)
  const bgStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/trip-bg.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="qna-write-wrapper" style={bgStyle}>
      <div className="qna-write-card">
        <h2 className="qna-write-title">문의하기</h2>

        <p className="qna-write-sub">
          궁금한 점이 있으신가요? 언제든 편하게 남겨주세요.
        </p>

        <input
          className="qna-input"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="qna-textarea"
          placeholder="문의 내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button className="qna-submit-btn" onClick={handleSubmit}>
          문의 등록
        </button>
      </div>
    </div>
  );
}
