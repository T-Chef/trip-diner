import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../../../styles/side/board/BoardDetail.css";

const API_BASE = "http://localhost:4000/api";

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.user_id;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const textRef = useRef(null);

  const autoResize = () => {
    if (!textRef.current) return;
    textRef.current.style.height = "auto";
    textRef.current.style.height = textRef.current.scrollHeight + "px";
  };

  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/comment/${id}`);
      setComments(res.data);
    } catch (error) {
      console.error("댓글 로드 실패:", error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      axios.get(`${API_BASE}/posts/${id}`)
        .then((res) => {
          setPost(res.data);
        })
        .catch((err) => {
          console.error("게시글 로드 실패:", err);
          Swal.fire("오류", "게시글을 찾을 수 없습니다.", "error");
        });
    }
  }, [id]); 

  useEffect(() => {
    if (id) {
      fetchComments();

      if (user_id) {
        axios.get(`${API_BASE}/like/post/${id}/status?user_id=${user_id}`)
          .then((res) => {
            setLiked(res.data.liked);
            setLikeCount(res.data.count);
          })
          .catch((err) => console.error("좋아요 상태 확인 실패:", err));
      }
    }
  }, [id, user_id, fetchComments]);

  const toggleLike = async () => {
    if (!user_id) return Swal.fire("로그인 필요", "로그인 후 가능합니다.", "warning");
    try {
      const res = await axios.post(`${API_BASE}/like/post/${id}`, { user_id });
      setLiked(res.data.liked);
      setLikeCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      Swal.fire("오류", "좋아요 처리에 실패했습니다.", "error");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user_id) return Swal.fire("로그인 필요", "댓글을 작성하려면 로그인하세요.", "warning");

    try {
      await axios.post(`${API_BASE}/comment`, { post_id: id, user_id, content: newComment });
      setNewComment("");
      if (textRef.current) textRef.current.style.height = "40px";
      fetchComments();
    } catch {
      Swal.fire("오류", "댓글 저장에 실패했습니다.", "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (!post) return <div className="loading">로딩 중...</div>;

  return (
    <div className="detail-container">
      <div className="board-banner">Trip-Diner</div>

      <div className="board-detail board-wrapper">
        <div className="detail-header">
          <div className="category-tag" onClick={() => navigate(`/board/list/${post.category}`)} style={{ cursor: 'pointer' }}>
            {post.category} 게시판 &gt;
          </div>
          
          <h2 className="detail-title">{post.title}</h2>
          
          <div className="post-meta">
            <img 
              src={post.user?.profile_img ? `http://localhost:4000${post.user.profile_img}` : "/default_profile.png"} 
              className="meta-profile-img" 
              alt="프로필" 
            />
            <div className="meta-text-group">
              <span className="meta-author">{post.user?.name || "익명"}</span>
              <div className="meta-bottom">
                <span className="meta-date">{formatDate(post.created_at)}</span>
                <span className="meta-views">조회 {post.views || 0}</span>
              </div>
            </div>

            <div className="meta-comment-count">
              <span className="comment-icon">💬</span>
              댓글 {comments.length}
            </div>
          </div>
        </div>

         <div className="detail-body" dangerouslySetInnerHTML={{ __html: post.content }} style={{ minHeight: "200px", padding: "20px 0" }} />

        <div className="cafe-comment-stats">
          <button className="like-btn" onClick={toggleLike}>
            <span className="like-icon">{liked ? "❤️" : "🤍"}</span>
            좋아요 {likeCount}
          </button>
          <span>댓글 {comments.length}</span>
        </div>

        {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="post-tags-container">
            {post.tags.map((tag, index) => (
              <span key={index} className="post-tag-item">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <hr className="stats-separator" />
        <div className="comment-input-area">
          <textarea 
            ref={textRef} 
            className="comment-textarea" 
            placeholder="댓글을 입력하세요..." 
            value={newComment} 
            onChange={(e) => {setNewComment(e.target.value); autoResize();}} 
          />
          <button className="comment-submit-btn" onClick={handleAddComment}>등록</button>
        </div>

        <div className="comment-list">
          {comments.map((c) => (
            <div key={c.comment_id} className="comment-item">
              <img src={c.user?.profile_img ? `http://localhost:4000${c.user.profile_img}` : "/default_profile.png"} className="comment-profile" alt="P" />
              <div className="comment-body">
                <span className="comment-writer">{c.user?.name}</span>
                <div className="comment-content-text">{c.content}</div>
                <div className="comment-date">{formatDate(c.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

