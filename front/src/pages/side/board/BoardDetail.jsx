import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../../../styles/side/board/BoardDetail.css";

const API_BASE = "http://localhost:4000/api";

export default function BoardDetail() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.user_id;

  const [post, setPost] = useState(null);

  // 댓글
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  // 좋아요
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const textRef = useRef(null);

  /* textarea 자동 높이 */
  const autoResize = () => {
    if (!textRef.current) return;
    textRef.current.style.height = "auto";
    textRef.current.style.height = textRef.current.scrollHeight + "px";
  };

  /* ---------------------------
      댓글 DB 저장
  ---------------------------- */
  const handleAddComment = async () => {
    if (!user_id) {
      return Swal.fire(
        "로그인 필요",
        "댓글 작성은 로그인 후 가능합니다.",
        "warning"
      );
    }

    if (!newComment.trim()) return;

    try {
      const res = await axios.post(`${API_BASE}/comment`, {
        post_id: id,
        user_id,
        content: newComment,
        parent_id: null,
      });

      setComments((prev) => [...prev, res.data.newComment]);
      setNewComment("");
      autoResize();
    } catch {
      Swal.fire("오류", "댓글 저장 실패", "error");
    }
  };

  /* ---------------------------
      게시글 / 좋아요 / 댓글 로딩
  ---------------------------- */
  useEffect(() => {
    // 게시글
    axios.get(`${API_BASE}/posts/${id}`).then((res) => {
      setPost(res.data);
    });

    // 댓글
    axios
      .get(`${API_BASE}/comment/${id}`)
      .then((res) => setComments(res.data))
      .catch(() => console.log("댓글 불러오기 실패"));

    // 좋아요 상태 + 개수 (핵심 수정)
    if (user_id) {
      axios.get(`${API_BASE}/like/post/${user_id}`).then((res) => {
        const likedPosts = res.data || [];

        const isLiked = likedPosts.some(
          (item) => Number(item.post_id) === Number(id)
        );

        const count = likedPosts.filter(
          (item) => Number(item.post_id) === Number(id)
        ).length;

        setLiked(isLiked);
        setLikeCount(count);
      });
    }
  }, [id, user_id]);

  /* ---------------------------
      좋아요 토글
  ---------------------------- */
  const toggleLike = async () => {
    if (!user_id) {
      return Swal.fire(
        "로그인 필요",
        "로그인 후 좋아요 가능합니다.",
        "warning"
      );
    }

    try {
      const res = await axios.post(`${API_BASE}/like/post`, {
        userId: user_id,
        postId: id,
        liked: !liked,
      });

      setLiked(res.data.liked);
      setLikeCount((prev) => (res.data.liked ? prev + 1 : prev - 1));
    } catch {
      Swal.fire("오류", "좋아요 처리 실패", "error");
    }
  };

  if (!post) return <div>로딩중...</div>;

  return (
    <div className="detail-container">
      <div className="board-detail">
        <div className="detail-top-actions">
          <button className="back-btn" onClick={() => window.history.back()}>
            목록으로
          </button>
        </div>

        <div className="detail-content">
          <h2 className="detail-title">{post.title}</h2>

          <div
            className="detail-body"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="detail-actions">
            <button className="like-btn" onClick={toggleLike}>
              {liked ? "❤️" : "🤍"} {likeCount}
            </button>
          </div>
        </div>

        {/* 댓글 */}
        <div className="detail-comments">
          <h3 className="comment-title">댓글</h3>

          <div className="comment-input-area">
            <textarea
              ref={textRef}
              className="comment-textarea"
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                autoResize();
              }}
            />
            <button className="comment-submit-btn" onClick={handleAddComment}>
              등록
            </button>
          </div>

          <div className="comment-list">
            {comments.map((c) => (
              <div key={c.comment_id} className="comment-item">
                <img
                  src={
                    c.user?.profile_img
                      ? `http://localhost:4000${c.user.profile_img}`
                      : "/default_profile.png"
                  }
                  className="comment-profile"
                  alt=""
                />
                <div className="comment-info">
                  <div className="comment-writer">{c.user?.name}</div>
                  <div className="comment-content">{c.content}</div>
                  <div className="comment-date">
                    {c.created_at?.slice(0, 10)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
