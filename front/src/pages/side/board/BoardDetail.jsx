import React, { useState } from "react";
import "../../../styles/side/board/Board.css";

export default function BoardDetail() {
  const [comments, setComments] = useState([
    { id: 1, writer: "철수", content: "좋은 정보 감사합니다!", date: "2025-01-20" },
    { id: 2, writer: "짱아", content: "사진 너무 예뻐요!", date: "2025-01-21" },
  ]);

  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment = {
      id: comments.length + 1,
      writer: "로그인유저",
      content: newComment,
      date: new Date().toISOString().slice(0, 10)
    };

    setComments([...comments, comment]);
    setNewComment("");
  };

  return (
    <div className="board-container">
      <h2 className="board-title">게시글 상세</h2>

      {/* 게시글 내용 */}
      <div className="post-content">
        <h3>제목: 여행 후기 올립니다!</h3>
        <p>작성자: 조서희 · 작성일: 2025-01-21</p>

        {/* 업로드된 이미지 표시 */}
        <img
          src="https://via.placeholder.com/400x250"
          alt="uploaded"
          className="detail-image"
        />

        <p className="mt-4">
          부산 여행 다녀왔어요! 정말 예쁘고 좋았습니다~
        </p>
      </div>

      {/* 댓글 리스트 */}
      <h3 className="comment-title">댓글</h3>
      <div className="comment-list">
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <strong>{c.writer}</strong>
            <span className="comment-date">{c.date}</span>
            <p>{c.content}</p>
          </div>
        ))}
      </div>

      {/* 댓글 작성 */}
      <div className="comment-input-box">
        <textarea
          className="comment-textarea"
          value={newComment}
          placeholder="댓글을 입력하세요..."
          onChange={(e) => setNewComment(e.target.value)}
        />

        <button className="write-btn" onClick={handleAddComment}>
          댓글 등록
        </button>
      </div>
    </div>
  );
}
