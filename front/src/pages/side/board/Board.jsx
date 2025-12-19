import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // 🚨 useParams 추가
import axios from "axios";
import "../../../styles/side/board/Board.css";

export default function Board() {
  const navigate = useNavigate();
  const { category: urlCategory } = useParams(); // 🚨 URL에서 /board/list/:category 파라미터 읽기

  // 로그인 정보
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user] = useState(storedUser);

  // ⭐ 프로필 이미지 URL 생성
  const PROFILE_BASE_URL = "http://localhost:4000";
  const profileSrc = user?.profile_img
    ? (user.profile_img.startsWith(PROFILE_BASE_URL)
        ? user.profile_img
        : `${PROFILE_BASE_URL}${user.profile_img.startsWith('/') ? '' : '/'}${user.profile_img}`)
    : "/default_profile.png";

  // 게시글 데이터 상태 관리
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  /* 게시글 전체 로드 */
  useEffect(() => {
    axios
      .get("http://localhost:4000/api/posts")
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("글 불러오기 오류:", err));
  }, []);

  // ************************************************************
  // 🚨 [추가된 핵심 로직] URL 파라미터 변경 시 카테고리 상태 동기화
  // ************************************************************
  useEffect(() => {
    if (urlCategory) {
      // URL 파라미터가 있으면 해당 카테고리로 상태 변경 (전체보기 대응)
      setCategory(urlCategory === "전체" ? "전체" : urlCategory);
    } else {
      setCategory("전체");
    }
    setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 이동
  }, [urlCategory]);

  // 🚨 카테고리 클릭 시 URL을 변경해주는 핸들러
  const handleCategoryChange = (cat) => {
    const targetPath = cat === "전체보기" ? "전체" : cat;
    // URL을 직접 변경하여 상단의 useEffect([urlCategory])가 실행되도록 유도
    navigate(`/board/list/${targetPath}`); 
  };
  // ************************************************************

  /* 카테고리 필터 */
  const filteredPosts =
    category === "전체" || category === "전체보기" 
      ? posts 
      : posts.filter((p) => p.category === category);

  /* 페이지네이션 계산 */
  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="board-page">
      <div className="board-wrapper">
        <div className="board-banner">여행 게시판</div>

        <div className="board-layout">
          {/* ------------------ 왼쪽 메뉴 ------------------ */}
          <div className="left-panel">

            {/* ⭐ 프로필 박스 */}
            <div className="board-profile-view">
              <div className="profile-circle">
                <img src={profileSrc} alt="프로필" />
              </div>
              <div className="board-profile-name">{user?.name} 님</div>
              <div className="board-profile-welcome">
                환영합니다 {user?.name}님!
              </div>
            </div>

            {/* ⭐ 카테고리 리스트 (map을 사용하여 최적화) */}
            <ul className="category-list">
              {["전체보기", "자유", "후기", "질문", "Q&A"].map((cat) => (
                <li
                  key={cat}
                  // 현재 선택된 카테고리와 메뉴명이 일치하면 'active' 클래스 부여
                  className={(category === cat || (category === "전체" && cat === "전체보기")) ? "active" : ""}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </li>
              ))}
            </ul>
          </div>

          {/* ------------------ 오른쪽 게시판 ------------------ */}
          <div className="right-panel">
            <div className="post-header">
              <div className="col-category">종류</div>
              <div className="col-title">제목</div>
              <div className="col-writer">작성자</div>
              <div className="col-date">작성일</div>
              <div className="col-views">조회수</div>
            </div>

              <div className="post-section">
              {currentPosts.length > 0 ? (
                currentPosts.map((p) => (
                  <div
                    key={p.post_id}
                    className="post-row"
                    onClick={() => navigate(`/board/${p.post_id}`)}
                  >
                    <div className="col-category">{p.category}</div>
                    
                    {/* ✅ 제목 영역에 댓글 수 추가 */}
                    <div className="col-title">
                      {p.title}
                      {p._count?.comment > 0 && ( // 여기를 수정!
                        <span style={{ 
                          color: "#ff4d4f", 
                          fontWeight: "bold", 
                          marginLeft: "6px",
                          fontSize: "0.95em"
                        }}>
                          [{p._count.comment}] {/* 여기도 수정! */}
                        </span>
                      )}
                    </div>

                    <div className="col-writer">{p.user?.name || "익명"}</div>
                    <div className="col-date">{p.created_at?.slice(0, 10)}</div>
                    <div className="col-views">{p.views || 0}</div>
                  </div>
                ))
              ) : (
                <div className="no-posts" style={{textAlign: "center", padding: "50px"}}>
                  해당 카테고리에 게시글이 없습니다.
                </div>
              )}
            </div>

            <div className="pagination">
              <span onClick={() => changePage(currentPage - 1)} style={{cursor: "pointer"}}>{"<"}</span>
              {[...Array(totalPages)].map((_, i) => (
                <span
                  key={i}
                  className={currentPage === i + 1 ? "active-page" : ""}
                  onClick={() => changePage(i + 1)}
                >
                  {i + 1}
                </span>
              ))}
              <span onClick={() => changePage(currentPage + 1)} style={{cursor: "pointer"}}>{">"}</span>

            </div>

            <button
              className="write-btn"
              onClick={() => navigate("/board/write")}
            >
              글쓰기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}