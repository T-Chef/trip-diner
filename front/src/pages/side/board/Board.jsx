import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../styles/side/board/Board.css";

import BoardProfile from "./BoardProfile";

export default function Board() {
  const navigate = useNavigate();

  // 로그인 정보
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user, setUser] = useState(storedUser);

  // 게시글 / 카테고리 / 페이지 상태
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  const postsPerPage = 10;

  /*------------------------------------------
    📌 날짜 포맷 함수 ("방금 전" / "3시간 전" / "2025.12.08")
  -------------------------------------------*/
const formatDate = (value) => {
  if (!value) return "-";

  let date;

  // 1) Date 객체인 경우
  if (value instanceof Date) {
    date = value;
  }
  // 2) 문자열인 경우
  else if (typeof value === "string") {
    // 문자열 → Date 변환 (replace 절대 사용 안함)
    date = new Date(value);
  }
  // 3) 숫자(timestamp)
  else if (typeof value === "number") {
    date = new Date(value);
  }
  // 그 외는 출력 불가
  else {
    return "-";
  }

  // 변환 실패
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const diffSec = (now - date) / 1000;

  if (diffSec < 60) return "방금 전";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;

  return date.toISOString().slice(0, 10).replace(/-/g, ".");
};


  /*------------------------------------------
    📌 DB에서 게시글 가져오기
  -------------------------------------------*/
  useEffect(() => {
    axios
      .get("http://localhost:4000/api/posts")
      .then((res) => {
        console.log("불러온 데이터:", res.data);
        setPosts(res.data);
      })
      .catch((err) => console.error("글 불러오기 오류:", err));
  }, []);

  /*------------------------------------------
    📌 카테고리 필터 적용
  -------------------------------------------*/
  const filteredPosts =
    category === "전체"
      ? posts
      : posts.filter((p) => p.category === category);

  /*------------------------------------------
    📌 페이지 계산
  -------------------------------------------*/
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
      {/* 배너 */}
      <div className="board-banner">여행 게시판</div>

      <div className="board-layout">
        {/* ------------------ 왼쪽 메뉴 ------------------ */}
        <div className="left-panel">
          <BoardProfile user={user} setUser={setUser} />

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
          {/* 테이블 헤더 */}
          <div className="post-header">
            <div className="col-category">종류</div>
            <div className="col-title">제목</div>
            <div className="col-writer">작성자</div>
            <div className="col-date">작성일</div>
            <div className="col-views">조회수</div>
          </div>

          {/* 게시글 목록 */}
          <div className="post-section">
            {currentPosts.length > 0 ? (
              currentPosts.map((p) => (
                <div
                  key={p.post_id}
                  className="post-row"
                  onClick={() => navigate(`/board/${p.post_id}`)}
                >
                  <div className="col-category">{p.category || "-"}</div>
                  <div className="col-title">{p.title}</div>
                  <div className="col-writer">{p.user?.name ?? "익명"}</div>

                  <div className="col-date">{formatDate(p.created_at)}</div>

                  <div className="col-views">{p.views ?? 0}</div>
                </div>
              ))
            ) : (
              <p
                style={{
                  textAlign: "center",
                  color: "#777",
                  marginTop: "20px",
                }}
              >
                게시글이 없습니다.
              </p>
            )}
          </div>

          {/* 페이지네이션 */}
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

          {/* 글쓰기 */}
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