import { useEffect, useState } from "react";
import axios from "axios";
import "../../../styles/side/mypage/UserQnAList.css";

export default function UserQnAList() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchQna = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await axios.get("http://localhost:4000/api/qna/my", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        setList(res.data.data);
      } catch (err) {
        console.error("QnA 목록 오류:", err);
        alert("문의 목록 조회 실패");
      }
    };

    fetchQna();
  }, []);

  const convertStatus = (status) => {
    if (status === "WAITING") return "대기중";
    if (status === "DONE") return "답변완료";
    return status;
  };

  const openDetail = async (id) => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.get(`http://localhost:4000/api/qna/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setSelected(res.data.data);
      setOpen(true);
    } catch (err) {
      console.error("QnA 상세 오류 :", err);

      if (err.response?.status === 401) {
        alert("로그인이 필요합니다. 다시 로그인 해주세요.");
      } else {
        alert("문의 상세 조회 실패");
      }
    }
  };

  const getAnswerText = (q) => {
    if (!q) return "";

    if (Array.isArray(q.qna_answer) && q.qna_answer.length > 0) {
      return q.qna_answer[0].content || "";
    }

    if (q.qna_answer && typeof q.qna_answer === "object") {
      return q.qna_answer.content || "";
    }

    if (q.answer) {
      if (typeof q.answer === "string") return q.answer;
      if (q.answer.content) return q.answer.content;
      if (q.answer.text) return q.answer.text;
    }

    return q.reply || q.admin_answer || q.adminReply || q.response || "";
  };

  return (
    <>
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          backgroundImage: `url("/assets/images/trip-bg.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.45)",
          }}
        ></div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            paddingTop: "80px",
          }}
        >
          <div className="qna-container">
            <h2 className="qna-title">내 문의 목록</h2>

            {list.length === 0 ? (
              <p className="qna-empty">등록한 문의가 없습니다.</p>
            ) : (
              <table className="qna-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>제목</th>
                    <th>상태</th>
                    <th>작성일</th>
                  </tr>
                </thead>

                <tbody>
                  {list.map((q) => (
                    <tr key={q.qna_id}>
                      <td>{q.qna_id}</td>

                      <td
                        style={{
                          cursor: "pointer",
                          color: "#6b5dff",
                          textDecoration: "underline",
                        }}
                        onClick={() => openDetail(q.qna_id)}
                      >
                        {q.title}
                      </td>

                      <td>
                        {q.status === "WAITING" ? (
                          <span className="badge-wait">⏳ 대기중</span>
                        ) : (
                          <span className="badge-done">✔ 답변완료</span>
                        )}
                      </td>

                      <td>{q.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {open && selected && (
        <div className="qna-modal-back">
          <div className="qna-modal">
            <h3>{selected.title}</h3>

            <div style={{ marginBottom: "10px", color: "#555" }}>
              작성일: {selected.created_at?.slice(0, 10)}
              &nbsp;&nbsp;|&nbsp;&nbsp; 상태: {convertStatus(selected.status)}
            </div>

            <h4>문의 내용</h4>
            <p>{selected.content}</p>

            <h4>관리자 답변</h4>
            <p>
              {getAnswerText(selected)
                ? getAnswerText(selected)
                : "아직 답변이 등록되지 않았습니다."}
            </p>

            <button className="qna-close-btn" onClick={() => setOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
