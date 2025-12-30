import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:4000/api";

export default function UserQnaDetail() {
  const { id } = useParams();
  const [qna, setQna] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    axios
      .get(`${API}/qna/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setQna(res.data.data);
      })
      .catch(() => alert("문의 조회 실패"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40 }}>불러오는 중...</div>;
  if (!qna) return <div style={{ padding: 40 }}>데이터 없음</div>;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h2>문의 상세</h2>

      <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 10 }}>
        <p>
          <b>제목 :</b> {qna.title}
        </p>
        <p>
          <b>내용 :</b>
        </p>
        <div style={{ whiteSpace: "pre-wrap" }}>{qna.content}</div>
      </div>

      <h3 style={{ marginTop: 30 }}>관리자 답변</h3>

      {qna.answer ? (
        <div
          style={{
            background: "#eef4ff",
            padding: 20,
            borderRadius: 10,
            border: "1px solid #c6d4ff",
          }}
        >
          <span
            style={{
              background: "#4d6fff",
              color: "white",
              padding: "4px 10px",
              borderRadius: 20,
              fontSize: 12,
            }}
          >
            관리자 답변
          </span>

          <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
            {qna.answer.content}
          </div>
        </div>
      ) : (
        <div style={{ padding: 20, color: "#777" }}>
          아직 답변이 등록되지 않았습니다.
        </div>
      )}
    </div>
  );
}
