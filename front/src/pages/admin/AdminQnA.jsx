import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminQnA.css";

export default function AdminQnA() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [answer, setAnswer] = useState("");

  const fetchQna = async () => {
    const res = await axios.get("http://localhost:4000/api/admin/qna");
    setList(res.data);
  };

  useEffect(() => {
    fetchQna();
  }, []);

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert("답변을 입력하세요");
      return;
    }

    await axios.post(
      `http://localhost:4000/api/admin/qna/${selected.qna_id}/answer`,
      {
        admin_id: 1,
        content: answer,
      }
    );

    setAnswer("");
    setSelected(null);
    fetchQna();
  };

  return (
    <div className="admin-qna">
      <h1>1:1 문의 관리</h1>

      <div className="qna-layout">
        {/* 왼쪽 문의 목록 */}
        <div className="qna-list">
          {list.map((q) => (
            <div
              key={q.qna_id}
              className={`qna-item ${q.status === "WAITING" ? "waiting" : ""}`}
              onClick={() => setSelected(q)}
            >
              <div className="title">{q.title}</div>
              <div className="meta">
                {q.user?.name} · {q.status}
              </div>
            </div>
          ))}
        </div>

        {/* 오른쪽 상세/답변 */}
        {selected && (
          <div className="qna-detail">
            <h3>{selected.title}</h3>
            <p className="content">{selected.content}</p>

            {selected.qna_answer.length > 0 ? (
              <div className="answered">
                <strong>관리자 답변</strong>
                <p>{selected.qna_answer[0].content}</p>
              </div>
            ) : (
              <>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="관리자 답변을 입력하세요"
                />
                <button onClick={submitAnswer}>답변 등록</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
