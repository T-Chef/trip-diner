import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/MyComments.css";

export default function MyComments() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.user_id || user?.id;

  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!user_id) return;

    axios
      .get(`http://localhost:4000/api/comment/user/${user_id}`)
      .then((res) => setComments(res.data))
      .catch((err) => console.error("내 댓글 불러오기 실패:", err));
  }, [user_id]);

  return (
    <>
      {/* 🔥 전체 백그라운드 + 오버레이 */}
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
        {/* 어두운 레이어 */}
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

        {/* 콘텐츠 영역 */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            paddingTop: "80px",
          }}
        >
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
                  comments.map((c) => (
                    <tr
                      key={c.comment_id}
                      onClick={() => navigate(`/board/${c.post_id}`)}
                      style={{ cursor: "pointer" }}
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
          </div>
        </div>
      </div>
    </>
  );
}
