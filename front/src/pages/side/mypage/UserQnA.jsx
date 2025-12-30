import { useState } from "react";
import axios from "axios";

export default function UserQnA() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const submitQna = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    const token = localStorage.getItem("accessToken");

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:4000/api/qna",
        {
          title: title.trim(),
          content: content.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("문의가 등록되었습니다 😊");
      setTitle("");
      setContent("");
    } catch (err) {
      console.error("문의 등록 실패:", err.response || err);

      alert(err.response?.data?.message || "문의 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "80px auto" }}>
      <h2>문의하기</h2>

      <input
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          marginBottom: 10,
          padding: 8,
          fontSize: 16,
        }}
      />

      <textarea
        placeholder="문의 내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: "100%",
          height: 200,
          padding: 10,
          fontSize: 16,
        }}
      />

      <button
        onClick={submitQna}
        disabled={loading}
        style={{
          marginTop: 10,
          padding: "10px 16px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "등록 중..." : "문의 등록"}
      </button>
    </div>
  );
}
