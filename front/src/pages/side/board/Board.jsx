import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../styles/side/board/Board.css";

export default function Board() {
  const navigate = useNavigate();

  // 로그인 정보
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user] = useState(storedUser);

  // ⭐ 프로필 이미지 URL 생성 (수정된 핵심 로직)
  // URL 중복을 방지하고 BASE URL을 조건부로 붙여줍니다.
  const PROFILE_BASE_URL = "http://localhost:4000";

  const profileSrc = user?.profile_img
    ? // 1. 이미 전체 URL(http://localhost:4000 포함)인 경우 그대로 사용
      (user.profile_img.startsWith(PROFILE_BASE_URL)
        ? user.profile_img
        : // 2. 상대 경로(/uploads/...)인 경우에만 BASE_URL을 붙임
          `${PROFILE_BASE_URL}${user.profile_img.startsWith('/') ? '' : '/'}${user.profile_img}`)
    : "/default_profile.png"; // 경로가 없으면 기본 이미지

  // 게시글 데이터 상태 관리
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10; // postsPerPage 변수 정의

  /* 게시글 로드 */
  useEffect(() => {
    axios
      .get("http://localhost:4000/api/posts")
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("글 불러오기 오류:", err));
  }, []);

  // ************************************************
  // ⭐ ESLint 오류 해결: 필터링 및 페이지네이션 로직 복원 ⭐
  // ************************************************

  /* 카테고리 필터 */
  const filteredPosts =
    category === "전체" ? posts : posts.filter((p) => p.category === category);

  /* 페이지네이션 변수 정의 */
  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirst, indexOfLast); // currentPosts 정의
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage); // totalPages 정의

  /* 페이지 변경 함수 정의 */
  const changePage = (page) => { // changePage 정의
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // ************************************************

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
                <img src={profileSrc} alt=""/>
              </div>

              <div className="board-profile-name">{user?.name} 님</div>
              <div className="board-profile-welcome">
                환영합니다 {user?.name}님!
              </div>
            </div>

            {/* 카테고리 리스트 */}
            <ul className="category-list">
              <li
                className={category === "전체" ? "active" : ""}
                onClick={() => {
                  setCategory("전체");
                  setCurrentPage(1);
                }}
              >
                전체보기
              </li>

              <li
                className={category === "자유" ? "active" : ""}
                onClick={() => {
                  setCategory("자유");
                  setCurrentPage(1);
                }}
              >
                자유
              </li>

              <li
                className={category === "후기" ? "active" : ""}
                onClick={() => {
                  setCategory("후기");
                  setCurrentPage(1);
                }}
              >
                후기
              </li>

              <li
                className={category === "질문" ? "active" : ""}
                onClick={() => {
                  setCategory("질문");
                  setCurrentPage(1);
                }}
              >
                질문
              </li>

              <li
                className={category === "Q&A" ? "active" : ""}
                onClick={() => {
                  setCategory("Q&A");
                  setCurrentPage(1);
                }}
              >
                Q&A
              </li>
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
              {currentPosts.map((p) => (
                <div
                  key={p.post_id}
                  className="post-row"
                  onClick={() => navigate(`/board/${p.post_id}`)}
                >
                  <div className="col-category">{p.category}</div>
                  <div className="col-title">{p.title}</div>
                  <div className="col-writer">{p.user?.name}</div>
                  <div className="col-date">{p.created_at?.slice(0, 10)}</div>
                  <div className="col-views">{p.views}</div>
                </div>
              ))}
            </div>

            <div className="pagination">
              <span onClick={() => changePage(currentPage - 1)}>{"<"}</span>
              {[...Array(totalPages)].map((_, i) => (
                <span
                  key={i}
                  className={currentPage === i + 1 ? "active-page" : ""}
                  onClick={() => changePage(i + 1)}
                >
                  {i + 1}
                </span>
              ))}
              <span onClick={() => changePage(currentPage + 1)}>{">"}</span>
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