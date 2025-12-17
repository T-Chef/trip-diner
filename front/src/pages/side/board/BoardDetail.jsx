
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom"; 
import axios from "axios";
import Swal from "sweetalert2";
import "../../../styles/side/board/BoardDetail.css";

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

   const textRef = useRef(null); // 일반 댓글 textarea Ref

   /* textarea 자동 높이 */
   const autoResize = (ref) => {
     if (!ref.current) return;
   ref.current.style.height = "auto";
   ref.current.style.height = ref.current.scrollHeight + "px";
   };
   
  /* ---------------------------
      프로필 클릭 핸들러: 제거됨
  ---------------------------- */
  
   /* ---------------------------
      댓글 목록 불러오기 함수 (useCallback으로 메모이징)
  ---------------------------- */
   const fetchComments = useCallback(async () => {
   try {
   const res = await axios.get(`http://localhost:4000/api/comment/${id}`);
   setComments(res.data);
   } catch (error) {
   console.log("댓글 불러오기 실패", error);
   }
   }, [id]);

   /* ---------------------------
      댓글 DB 저장 (일반 댓글 전용)
  ---------------------------- */
  const handleAddComment = async (parentId = null, content = newComment, setContent = setNewComment) => {
   if (!user_id) {
    return Swal.fire("로그인 필요", "댓글 작성은 로그인 후 가능합니다.", "warning");
   }

   if (!content.trim()) return;

   try {
   await axios.post("http://localhost:4000/api/comment", { 
   post_id: id,
   user_id,
   content: content,
   parent_id: null, // 일반 댓글 등록
   });

  fetchComments(); 
   
   // 상태 초기화
   setContent("");
   autoResize(textRef); 
   
   } catch (err) {
   Swal.fire("오류", "댓글 저장 실패", "error");
   }
 };


  /* ---------------------------
      상세글 / 좋아요 / 댓글 불러오기
  ---------------------------- */
   useEffect(() => {
   /* 글 */
  axios.get(`http://localhost:4000/api/posts/${id}`).then((res) => {
   setPost(res.data);
  });

   /* 좋아요 상태 */
   if (user_id) {
   axios
  .get(`http://localhost:4000/api/posts/${id}/like-status?user_id=${user_id}`)
   .then((res) => setLiked(res.data.liked));
   }

  /* 좋아요 개수 */
   axios
   .get(`http://localhost:4000/api/posts/${id}/likes-count`)
   .then((res) => setLikeCount(res.data.count));

   /* 댓글 목록 */
  fetchComments();
   }, [id, user_id, fetchComments]); 

   /* 좋아요 토글 */
   const toggleLike = async () => {
   if (!user_id) {
   return Swal.fire("로그인 필요", "로그인 후 좋아요 가능합니다.", "warning");
   }
    
    try {
        const res = await axios.post(`http://localhost:4000/api/posts/${id}/like`, {
            user_id,
        });

        if (res.data.liked) {
            setLiked(true);
            setLikeCount((prev) => prev + 1);
        } else {
            setLiked(false);
            setLikeCount((prev) => prev - 1);
        }
    } catch (error) {
        console.error("좋아요 토글 실패:", error);
        Swal.fire("오류", "좋아요 처리 중 문제가 발생했습니다.", "error");
    }
   };

   // post와 post.user가 모두 로드될 때까지 대기합니다.
   if (!post || !post.user) return <div>로딩중...</div>;


   return (
   <div className="detail-container">
        {/* ✨ 상단 배너 - 전체 폭 사용 */}
        <div className="board-banner">
   <span className="banner-text">Trip-Diner</span> 
   </div>
        
        {/* ✨ Wrapper - 760px 너비로 중앙 정렬 */}
   <div className="board-detail board-wrapper">
            
      
   {/* ------------------------------------- */}
   {/* 1. 본문 */}
   {/* ------------------------------------- */}
   <div className="detail-content">
    <h2 className="detail-title">{post.title}</h2>
    <div
      className="detail-body"
      dangerouslySetInnerHTML={{ __html: post.content }}
    ></div>
  </div>

  {/* ------------------------------------- */}
  {/* 2. 좋아요 & 댓글 수 표시 영역 (본문 아래) */}
  {/* ------------------------------------- */}
   <div className="cafe-comment-stats">
    <button className="like-btn" onClick={toggleLike}>
      <span className="like-icon">{liked ? "❤️" : "🤍"}</span>
      <span className="like-count">좋아요 {likeCount}</span>
  </button>
      <span className="comment-stats-count">댓글 {comments.filter(c => !c.parent_id).length}</span>
   </div>
      <hr className="stats-separator" /> 


   {/* ------------------------------------- */}
   {/* 4. 댓글 영역 시작 */}
   {/* ------------------------------------- */}
      <div className="detail-comments">

      {/* 일반 댓글 입력 */}
      <div className="comment-input-area">
        <textarea
          ref={textRef}
          className="comment-textarea"
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => {
            setNewComment(e.target.value);
            autoResize(textRef);
          }}
      />

   <button 
      className="comment-submit-btn" 
      onClick={() => handleAddComment(null, newComment, setNewComment)}
   >
  등록
   </button>
  </div>

   {/* 댓글 리스트 */}
    <div className="comment-list"> 
      {comments
      .filter(c => !c.parent_id) // 최상위 댓글만 필터링 (대댓글 제외)
      .map((c) => (
    <React.Fragment key={c.comment_id}>

  {/* 1. 최상위 댓글 렌더링 */}
    <div className="comment-item top-level">

  {/* 프로필 이미지 (클릭 이벤트 제거) */}
    <img
      src={
        c.user?.profile_img
        ? `http://localhost:4000${c.user.profile_img}`
        : "/default_profile.png"
      }
    className="comment-profile" 
      alt="프로필 이미지"
    />
 
  <div className="comment-body">
  <div className="comment-meta">
    <span 
      className="comment-writer" 
    >
      {c.user?.name}
    </span>
 </div>

  <div className="comment-content-text">{c.content}</div>
  <div className="comment-actions-bar">
  {/* 작성 시간 */}
    <span className="comment-date">
      {c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}
    </span>
 </div>
</div>
 </div>

 </React.Fragment>
))}
</div>
 </div>
 </div>
 </div>
 );
}
