import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/MyPosts.css";

export default function MyPosts() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.user_id || user?.id;

  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!user_id) return;

    axios
      .get(`http://localhost:4000/api/posts/user/${user_id}`)
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("내 글 불러오기 실패:", err));
  }, [user_id]);

  return (
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
          {posts.length > 0 ? (
            posts.map((p) => (
              <tr
                key={p.post_id}
                onClick={() => navigate(`/board/${p.post_id}`)}
                style={{ cursor: "pointer" }}
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
    </div>
  );
}
