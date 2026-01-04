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
    <>
      {/* 전체 배경 + 오버레이 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "auto", // 🔥 100vh 제거
          backgroundImage: `url("/assets/images/trip-bg.png")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          paddingBottom: "40px", // 🔥 살짝만 여백 유지
        }}
      >
        {/* 어두운 오버레이 */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
          }}
        />

        {/* 실제 콘텐츠 */}
        <div style={{ position: "relative", zIndex: 2, paddingTop: "80px" }}>
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
        </div>
      </div>
    </>
  );
}
