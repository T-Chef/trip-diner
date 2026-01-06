import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/MyPosts.css";

export default function MyPosts() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.user_id || user?.id;

  const [posts, setPosts] = useState([]);

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!user_id) return;

    axios
      .get(`http://localhost:4000/api/posts/user/${user_id}`)
      .then((res) => setPosts(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("내 글 불러오기 실패:", err));
  }, [user_id]);

  // 전체 페이지 수
  const totalPages = Math.ceil(posts.length / pageSize);

  // 현재 페이지 데이터
  const currentPosts = posts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="mypage-bg">
      <div className="mypage-overlay" />

      <div className="mypage-content">
        <div className="mypage-table-container">
          <h2 className="mypage-title">내가 쓴 게시글</h2>

          <table className="mypage-table">
            <thead>
              <tr>
                <th>종류</th>
                <th>제목</th>
                <th>작성일</th>
                <th>조회</th>
              </tr>
            </thead>

            <tbody>
              {currentPosts.length > 0 ? (
                currentPosts.map((p) => (
                  <tr
                    key={p.post_id}
                    onClick={() => navigate(`/board/${p.post_id}`)}
                    className="mypage-row"
                  >
                    <td>{p.category}</td>
                    <td className="mypage-title-cell">{p.title}</td>
                    <td>{p.created_at?.slice(0, 10)}</td>
                    <td>{p.views}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-text">
                    아직 작성한 게시글이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="mypage-pagination">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}>
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={page === i + 1 ? "active" : ""}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
