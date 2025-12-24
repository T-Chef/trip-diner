import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminQnA.css";

export default function AdminQna() {
  const [qnas, setQnas] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQna = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/admin/qna");
      setQnas(res.data);
    } catch (err) {
      console.error("QnA 목록 조회 실패:", err);
      alert("1:1 문의 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQna();
  }, []);

  return (
    <div className="admin-qna-page">
      <h1 className="admin-title">1:1 문의 관리</h1>

      <div className="admin-card">
        {loading ? (
          <p className="admin-empty">불러오는 중입니다...</p>
        ) : qnas.length === 0 ? (
          <p className="admin-empty">등록된 문의가 없습니다.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>작성자</th>
                <th>상태</th>
                <th>작성일</th>
              </tr>
            </thead>
            <tbody>
              {qnas.map((qna) => (
                <tr key={qna.qna_id}>
                  <td>{qna.qna_id}</td>
                  <td className="qna-title">{qna.title}</td>
                  <td>{qna.user?.name || "탈퇴회원"}</td>
                  <td>
                    <span
                      className={
                        qna.status === "ANSWERED"
                          ? "badge answered"
                          : "badge pending"
                      }
                    >
                      {qna.status === "ANSWERED" ? "답변완료" : "대기중"}
                    </span>
                  </td>
                  <td>{qna.created_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
