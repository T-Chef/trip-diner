import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import axios from "axios";
import Swal from "sweetalert2";
import "../../../styles/side/board/BoardDetail.css";

const API_BASE = "/api";

export default function BoardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 로그인 유저 정보
  const user = JSON.parse(localStorage.getItem("user"));
  const user_id = user?.user_id;

  // 상태 관리
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const textRef = useRef(null);

  const PROFILE_BASE = "http://localhost:8080";
  const profileSrc = post?.user?.profile_img
  ? (post.user.profile_img.startsWith("http")
      ? post.user.profile_img
      : `${PROFILE_BASE}${post.user.profile_img.startsWith("/") ? "" : "/"}${post.user.profile_img}`)
  : "/default_profile.png";


  // 댓글 입력창 자동 높이 조절
  const autoResize = () => {
    if (!textRef.current) return;
    textRef.current.style.height = "auto";
    textRef.current.style.height = textRef.current.scrollHeight + "px";
  };

  // 댓글 목록 가져오기 함수 (useCallback으로 최적화)
  const fetchComments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/comment/${id}`);
      setComments(res.data);
    } catch (error) {
      console.error("댓글 로드 실패:", error);
    }
  }, [id]);

  /** * [핵심 수정 1] 게시글 상세 정보 및 조회수 증가 
   * 의존성 배열에서 user_id와 fetchComments를 제거하여 
   * 페이지 진입 시(id 변경 시) 딱 한 번만 실행되도록 함
   */
  useEffect(() => {
    if (id) {
    api.get(`/api/posts/${id}`)
      .then((res) => {
        setPost(res.data.post); // ✅ 여기!!
      })
        .catch((err) => {
          console.error("게시글 로드 실패:", err);
          Swal.fire("오류", "게시글을 찾을 수 없습니다.", "error");
        });
    }
  }, [id]); 

  /**
   * [핵심 수정 2] 부수적인 데이터(댓글, 좋아요 상태) 로드
   * 좋아요 여부는 user_id가 확인된 시점에 한 번 더 실행될 수 있도록 분리
   */
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

  // 좋아요 토글
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

  // 댓글 등록
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user_id) return Swal.fire("로그인 필요", "댓글을 작성하려면 로그인하세요.", "warning");

    try {
      await axios.post(`${API_BASE}/comment`, { post_id: id, user_id, content: newComment });
      setNewComment("");
      if (textRef.current) textRef.current.style.height = "40px";
      fetchComments(); // 댓글 목록 새로고침
    } catch {
      Swal.fire("오류", "댓글 저장에 실패했습니다.", "error");
    }
  };

  // 날짜 포맷 함수
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
        {/* 상단 헤더 섹션 */}
        <div className="detail-header">
          <div className="category-tag" onClick={() => navigate(`/board/list/${post.category}`)} style={{ cursor: 'pointer' }}>
            {post.category} 게시판 &gt;
          </div>
          
          <h2 className="detail-title">{post.title}</h2>
          
          <div className="post-meta">
            <img 
              src={profileSrc} 
              className="meta-profile-img" 
              alt="프로필" 
            />
            <div className="meta-text-group">
              <span className="meta-author">{post.user?.name || "익명"}</span>
              <div className="meta-bottom">
                <span className="meta-date">{formatDate(post.created_at)}</span>
                {/* [중요] DB 스키마에 정의된 views 필드 사용 */}
                <span className="meta-views">조회 {post.views || 0}</span>
              </div>
            </div>

            <div className="meta-comment-count">
              <span className="comment-icon">💬</span>
              댓글 {comments.length}
            </div>
          </div>
        </div>

        {/* 본문 섹션 */}
        <div className="detail-body" dangerouslySetInnerHTML={{ __html: post.content }} />

        {/* 좋아요 버튼 섹션 */}
        <div className="cafe-comment-stats">
          <button className="like-btn" onClick={toggleLike}>
            <span className="like-icon">{liked ? "❤️" : "🤍"}</span>
            좋아요 {likeCount}
          </button>
          <span>댓글 {comments.length}</span>
        </div>
        <hr className="stats-separator" />

        {/* 댓글 입력창 */}
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

        {/* 댓글 리스트 */}
        <div className="comment-list">
          {comments.map((c) => (
            <div key={c.comment_id} className="comment-item">
              <img src={c.user?.profile_img ? `http://localhost:8080${c.user.profile_img}` : "/default_profile.png"} className="comment-profile" alt="P" />
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

