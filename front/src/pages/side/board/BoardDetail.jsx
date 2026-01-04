import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../../../styles/side/board/BoardDetail.css";

const API_BASE = "http://localhost:4000/api";

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.user_id || user?.id;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyTo, setReplyTo] = useState(null); 

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

  const organizedComments = useMemo(() => {
    const map = {};
    const roots = [];
    comments.forEach(c => { map[c.comment_id] = { ...c, children: [] }; });
    comments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.comment_id]);
      } else if (!c.parent_id) {
        roots.push(map[c.comment_id]);
      }
    });
    return roots;
  }, [comments]);

  useEffect(() => {
    if (id) {
      axios.get(`${API_BASE}/posts/${id}`).then((res) => setPost(res.data))
        .catch(() => Swal.fire("오류", "게시글을 찾을 수 없습니다.", "error"));
      fetchComments();
      if (user_id) {
        axios.get(`${API_BASE}/like/post/${id}/status?user_id=${user_id}`)
          .then((res) => {
            setLiked(res.data.liked);
            setLikeCount(res.data.count);
          });
      }
    }
  }, [id, user_id, fetchComments]);

  const toggleLike = async () => {
    if (!user_id) return Swal.fire("로그인 필요", "로그인 후 가능합니다.", "warning");
    try {
      const res = await axios.post(`${API_BASE}/like/post/${id}`, { user_id });
      setLiked(res.data.liked);
      setLikeCount(prev => res.data.liked ? prev + 1 : prev - 1);
    } catch {
      Swal.fire("오류", "좋아요 처리에 실패했습니다.", "error");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user_id) return Swal.fire("로그인 필요", "댓글을 작성하려면 로그인하세요.", "warning");
    try {
      await axios.post(`${API_BASE}/comment`, { 
        post_id: id, 
        user_id, 
        content: newComment,
        parent_id: replyTo ? replyTo.id : null 
      });
      setNewComment("");
      setReplyTo(null);
      if (textRef.current) textRef.current.style.height = "80px";
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

  const CommentItem = ({ comment, depth = 0 }) => (
    <div className="comment-item-wrapper" style={{ marginLeft: `${depth * 25}px`, width: '100%' }}>
      <div className="comment-item">
        {depth > 0 && <div className="reply-arrow">↳</div>}
        <img src={comment.user?.profile_img ? `http://localhost:4000${comment.user.profile_img}` : "/default_profile.png"} className="comment-profile" alt="P" />
        <div className="comment-body">
          <span className="comment-writer">{comment.user?.name}</span>
          <div className="comment-content-text">{comment.content}</div>
          <div className="comment-date">
            {formatDate(comment.created_at)}
            <button 
              className="reply-btn"
              onClick={() => { setReplyTo({ id: comment.comment_id, name: comment.user?.name }); textRef.current.focus(); }}
            >
              답글달기
            </button>
          </div>
        </div>
      </div>
      {comment.children.map(child => <CommentItem key={child.comment_id} comment={child} depth={depth + 1} />)}
    </div>
  );

  if (!post) return <div className="loading">로딩 중...</div>;

  return (
    <div className="detail-container">
      <div className="board-banner">Trip-Diner Review</div>

      <div className="board-detail board-wrapper">
        <div className="detail-header">
          <div className="category-tag" onClick={() => navigate(`/board/list/${post.category}`)}>
            {post.category} 게시판 &gt;
          </div>
          <h2 className="detail-title">{post.title}</h2>
          <div className="post-meta">
            <div className="meta-left">
              <img src={post.user?.profile_img ? `http://localhost:4000${post.user.profile_img}` : "/default_profile.png"} className="meta-profile-img" alt="프로필" />
              <div className="meta-text-group">
                <span className="meta-author">{post.user?.name || "익명"}</span>
                <div className="meta-bottom">
                  <span>{formatDate(post.created_at)}</span>
                  <span>조회 {post.views || 0}</span>
                </div>
              </div>
            </div>
            <div className="top-comment-count">댓글 {comments.length}</div>
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="detail-body" dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* ✅ 에러 방지 태그 영역 */}
        {post.tags && (
          <div className="post-tags-container">
            {(() => {
              let tagArray = [];
              try {
                if (Array.isArray(post.tags)) tagArray = post.tags;
                else if (typeof post.tags === "string") {
                  tagArray = post.tags.startsWith("[") ? JSON.parse(post.tags) : post.tags.split(",");
                }
              } catch (e) { tagArray = []; }
              return tagArray;
            })().map((tag, index) => {
              const displayTag = String(tag).trim().replace(/^#/, "");
              return displayTag ? <span key={index} className="post-tag-item">#{displayTag}</span> : null;
            })}
          </div>
        )}

        {/* 하단 통계 (좋아요, 댓글수) */}
        <div className="cafe-comment-stats">
          <button onClick={toggleLike} className="stat-like-btn">
            <span className="icon">{liked ? "❤️" : "🤍"}</span>
            좋아요 {likeCount}
          </button>
          <div className="stat-comment-count">
            <span className="icon">💬</span>
            댓글 {comments.length}
          </div>
        </div>

        {/* 댓글 입력 영역 */}
        <div className="comment-input-area">
          {replyTo && (
            <div className="reply-notice">
              <span><strong>@{replyTo.name}</strong> 님에게 답글 작성 중</span>
              <button onClick={() => setReplyTo(null)}>취소</button>
            </div>
          )}
          <div className="textarea-wrapper">
            <textarea 
              ref={textRef} 
              className="comment-textarea" 
              placeholder="따뜻한 댓글을 남겨주세요..." 
              value={newComment} 
              onChange={(e) => {setNewComment(e.target.value); autoResize();}} 
            />
            <button className="comment-submit-btn" onClick={handleAddComment}>등록</button>
          </div>
        </div>

        {/* 댓글 리스트 */}
        <div className="comment-list">
          {organizedComments.map((c) => <CommentItem key={c.comment_id} comment={c} />)}
        </div>
      </div>
    </div>
  );

}

