import { useState } from "react";
import axios from "axios";

export default function UserQnA() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const submitQna = async () => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      await axios.post(
        "http://localhost:4000/api/qna",
        { title, content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("문의가 등록되었습니다.");
      setTitle("");
      setContent("");
    } catch (err) {
      console.error(err);
      alert("문의 등록 실패");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "80px auto" }}>
      <h2>문의하기</h2>

      <input
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <textarea
        placeholder="문의 내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", height: 200 }}
      />

      <button onClick={submitQna} style={{ marginTop: 10 }}>
        문의 등록
      </button>
    </div>
  );
}
