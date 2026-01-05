import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function UserQnADetail() {
  const { id } = useParams();
  const [qna, setQna] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(`http://localhost:4000/api/qna/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setQna(res.data.data);
      } catch (err) {
        console.error("QnA 상세 오류:", err);
        alert("문의 상세 조회 실패");
      }
    };

    fetchDetail();
  }, [id]);

  if (!qna)
    return (
      <div style={{ marginTop: 100, textAlign: "center" }}>불러오는 중...</div>
    );

  return (
    <div style={{ maxWidth: 700, margin: "80px auto" }}>
      <h2>문의 상세</h2>

      <div
        style={{
          border: "1px solid #ddd",
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3>{qna.title}</h3>
        <p>{qna.content}</p>
        <p>상태 : {qna.status === "WAITING" ? "대기" : "답변완료"}</p>
      </div>

      <h3>관리자 답변</h3>

      {qna.qna_answer.length === 0 ? (
        <p>아직 답변이 등록되지 않았습니다.</p>
      ) : (
        <div
          style={{
            border: "1px solid #4CAF50",
            padding: 20,
            borderRadius: 8,
            background: "#f6fff6",
          }}
        >
          <p>{qna.qna_answer[0].content}</p>
          <small>답변일 : {qna.qna_answer[0].created_at?.slice(0, 10)}</small>
        </div>
      )}
    </div>
  );
}
