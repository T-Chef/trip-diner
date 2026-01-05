import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/MyComments.css";

export default function MyComments() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.user_id || user?.id;

  const [comments, setComments] = useState([]);

  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const limit = 10;
  const start = (page - 1) * limit;
  const end = start + limit;
  const totalPages = Math.ceil(comments.length / limit);

  useEffect(() => {
    if (!user_id) return;

    axios
      .get(`http://localhost:4000/api/comment/user/${user_id}`)
      .then((res) => setComments(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("내 댓글 불러오기 실패:", err));
  }, [user_id]);

  return (
    <div className="mypage-bg">
      <div className="mypage-overlay" />

      <div className="mypage-content">
        <div className="mypage-table-container">
          <h2 className="mypage-title">내가 쓴 댓글</h2>

          <table className="mypage-table">
            <thead>
              <tr>
                <th>댓글 내용</th>
                <th>작성일</th>
              </tr>
            </thead>

            <tbody>
              {comments.length > 0 ? (
                comments.slice(start, end).map((c) => (
                  <tr
                    key={c.comment_id}
                    className="mypage-row"
                    onClick={() => navigate(`/board/${c.post_id}`)}
                  >
                    <td className="mypage-title-cell">
                      {c.content.length > 50
                        ? c.content.slice(0, 50) + "..."
                        : c.content}
                    </td>
                    <td>{c.created_at?.slice(0, 10)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="empty-text">
                    아직 작성한 댓글이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                {"<"}
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={page === i + 1 ? "active" : ""}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                {">"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
