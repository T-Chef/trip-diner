import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../../../styles/side/mypage/UserQnAList.css";

export default function UserQnAList() {
  const [list, setList] = useState([]);

  useEffect(() => {
    const fetchQna = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const res = await axios.get("http://localhost:4000/api/qna/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("QNA RESPONSE ===>", res.data);
        setList(res.data.data);
      } catch (err) {
        console.error("QnA 목록 오류:", err);
        alert("문의 목록 조회 실패");
      }
    };

    fetchQna();
  }, []);

  return (
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

                <td>
                  <Link to={`/mypage/qna/${q.qna_id}`}>{q.title}</Link>
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
  );
}
