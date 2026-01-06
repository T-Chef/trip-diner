import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = "http://localhost:4000/api";

export default function AdminQnADetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [qna, setQna] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);

  // 문의 상세 조회
  useEffect(() => {
    axios
      .get(`${API}/admin/qna/${id}`)
      .then((res) => {
        console.log("상세 응답 ===>", res.data);

        if (!res.data?.success) {
          alert("존재하지 않는 문의입니다.");
          navigate("/admin/qna");
          return;
        }

        const data = res.data.data;
        setQna(data);
      })
      .catch((err) => {
        console.error("상세조회 실패:", err);
        alert("문의 상세 조회 실패");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // 답변 저장
  const submitAnswer = async () => {
    try {
      await axios.post(`${API}/admin/qna/${id}/answer`, {
        content: answer,
        admin_id: 1,
      });

      alert("답변 저장 완료");
      navigate("/admin/qna");
    } catch (err) {
      console.error("답변 저장 실패", err);
      alert("답변 저장 실패");
    }
  };

  if (loading) return <div style={{ padding: 40 }}>불러오는 중...</div>;
  if (!qna) return <div style={{ padding: 40 }}>데이터가 없습니다.</div>;

  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: 20 }}>문의 상세</h2>

      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "10px",
          boxShadow: "0 5px 15px rgba(0,0,0,0.06)",
          background: "#fff",
        }}
      >
        <p>
          <b>제목 :</b> {qna.title}
        </p>
        <p>
          <b>작성자 :</b> {qna.user?.name || "탈퇴회원"}
        </p>

        <p>
          <b>내용</b>
        </p>

        <div
          style={{
            whiteSpace: "pre-wrap",
            background: "#f8f9fa",
            padding: "15px",
            borderRadius: 10,
            border: "1px solid #eee",
          }}
        >
          {qna.content}
        </div>
      </div>

      <h3 style={{ marginTop: "35px" }}>관리자 답변</h3>

      {qna.answers?.length > 0 ? (
        <div
          style={{
            border: "1px solid #6c9fff",
            background: "#f4f6ff",
            padding: "18px",
            borderRadius: "12px",
            marginTop: "10px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.06)",
          }}
        >
          <span
            style={{
              background: "#6c9fff",
              color: "white",
              padding: "5px 10px",
              borderRadius: "20px",
              fontSize: 12,
            }}
          >
            관리자 답변
          </span>

          <div
            style={{
              marginTop: 10,
              whiteSpace: "pre-wrap",
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            {qna.answers[0].content}
          </div>
        </div>
      ) : (
        <p style={{ color: "#888" }}>등록된 답변이 없습니다.</p>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={6}
        style={{
          width: "100%",
          padding: 12,
          marginTop: 20,
          borderRadius: 10,
          border: "1px solid #ccc",
          resize: "none",
        }}
        placeholder="관리자 답변을 입력하세요"
      />

      <button
        onClick={submitAnswer}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          cursor: "pointer",
          borderRadius: 8,
          background: "#4C7CFF",
          color: "white",
          border: "none",
          fontSize: 15,
        }}
      >
        답변 저장
      </button>
    </div>
  );
}
