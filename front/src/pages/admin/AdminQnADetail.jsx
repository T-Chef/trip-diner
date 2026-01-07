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

  const fetchQna = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        alert("관리자 인증이 필요합니다.");
        navigate("/admin/login");
        return;
      }

      const res = await axios.get(`${API}/admin/qna/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("상세 응답 ===>", res.data);

      if (!res.data?.success) {
        alert("존재하지 않는 문의입니다.");
        navigate("/admin/qna");
        return;
      }

      setQna(res.data.data);
    } catch (err) {
      console.error("상세조회 실패:", err);
      alert("문의 상세 조회 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQna();
  }, [id]);

  const submitAnswer = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        alert("관리자 인증이 필요합니다.");
        navigate("/admin/login");
        return;
      }

      await axios.post(
        `${API}/admin/qna/${id}/answer`,
        {
          content: answer,
          admin_id: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("답변 저장 완료");
      fetchQna();
      setAnswer("");
    } catch (err) {
      console.error("답변 저장 실패", err);
      alert("답변 저장 실패");
    }
  };

  if (loading) return <div style={{ padding: 40 }}>불러오는 중...</div>;
  if (!qna) return <div style={{ padding: 40 }}>데이터가 없습니다.</div>;

  const bgStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/trip-back.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="admin-bg" style={bgStyle}>
      <div className="admin-overlay" />

      <div
        style={{
          width: "65%",
          maxWidth: "1150px",
          marginTop: "150px",
          marginBottom: "90px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <h2 style={{ textAlign: "center", color: "white", marginBottom: 25 }}>
          문의 상세
        </h2>

        <div
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "10px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
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

        <h3 style={{ marginTop: "35px", color: "white" }}>관리자 답변</h3>

        {qna.qna_answer && qna.qna_answer.length > 0 ? (
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
              {qna.qna_answer[0].content}
            </div>

            <small style={{ color: "#666" }}>
              답변일 : {qna.qna_answer[0].created_at?.slice(0, 10)}
            </small>
          </div>
        ) : (
          <p style={{ color: "#ddd" }}>등록된 답변이 없습니다.</p>
        )}

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #ddd",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: "18px",
            marginTop: "15px",
          }}
        >
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: "10px",
              border: "1px solid #ccc",
              padding: "12px",
              resize: "none",
            }}
            placeholder="관리자 답변을 입력하세요"
          />
        </div>

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
    </div>
  );
}
