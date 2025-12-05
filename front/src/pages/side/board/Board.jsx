import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/board/Board.css";

import BoardProfile from "./BoardProfile"; 

export default function Board() {

  const navigate = useNavigate();
  
  // 로그인된 사용자 정보 불러오기
const storedUser = JSON.parse(localStorage.getItem("user"));

// Board.jsx 내부에서 사용
const [user, setUser] = useState(storedUser);


  const notices = [
    { id: 1, title: "공지사항 안내입니다", writer: "관리자", date: "2025-12-03", views: 112 },
    { id: 2, title: "여행 후기 게시판 오픈!", writer: "관리자", date: "2024-11-27", views: 154 },
  ];

  const allPosts = [
    { id: 4, category: "질문", title: "재래시장은 몇시까지 하나요?", writer: "병아리", date: "2025-12-05", views: 77 },
    { id: 5, category: "후기", title: "빛축제 다녀왔어요!", writer: "여행러", date: "2025-11-11", views: 52 },
    { id: 6, category: "자유", title: "요즘 날씨 너무 춥다", writer: "짱구", date: "2025-11-05", views: 30 },
    { id: 7, category: "질문", title: "여행 관련 질문 있어요", writer: "호빵맨", date: "2025-11-01", views: 44 },
    { id: 8, category: "자유", title: "오늘 점심 뭐 드셨어요?", writer: "철수", date: "2025-11-20", views: 22 },
    { id: 9, category: "후기", title: "강릉 커피거리 너무 예뻐요!", writer: "유라", date: "2025-10-02", views: 65 },
    { id: 10, category: "자유", title: "비오는 날 여행도 로망있다", writer: "짱아", date: "2025-09-29", views: 18 },
    { id: 11, category: "잡담", title: "회사 쉬고 여행 가고 싶다…", writer: "철수", date: "2025-09-22", views: 41 },
    { id: 12, category: "후기", title: "부산 해운대 맛집 추천합니다!", writer: "도라에몽", date: "2025-09-10", views: 112 },
    { id: 13, category: "일상", title: "오늘 날씨 너무 맑고 좋아요 🌤", writer: "맹구", date: "2025-09-02", views: 15 },
    { id: 14, category: "질문", title: "혼자 여행 가면 어디가 좋아요?", writer: "다람쥐여행사", date: "2025-08-28", views: 29 },
    { id: 15, category: "잡담", title: "여권 갱신했어요!!", writer: "잠만보", date: "2025-08-15", views: 14 },
    { id: 16, category: "후기", title: "전주 한옥마을 갔다왔어요", writer: "콩쥐", date: "2025-08-10", views: 87 },
    { id: 17, category: "자유", title: "요즘 해외 항공권 너무 비싸…", writer: "흥부", date: "2025-08-05", views: 55 },
    { id: 18, category: "일상", title: "새 카메라 샀어요 📷", writer: "포토러버", date: "2025-07-30", views: 62 },
  ];

  const [category, setCategory] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);

  const postsPerPage = 10;

  const filteredPosts =
    category === "전체" ? allPosts : allPosts.filter((p) => p.category === category);

  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleCategory = (ct) => {
    setCategory(ct);
    setCurrentPage(1);
  };

  return (
    <div className="board-wrapper">

      {/* 배너 */}
      <div className="board-banner">여행 게시판</div>

      <div className="board-layout">

        {/* 왼쪽 메뉴 ------------------------------------------------ */}
        <div className="left-panel">
        {/* 프로필 영역 이제 컴포넌트로 렌더링 */}
          <BoardProfile user={user} setUser={setUser} />
          <ul className="category-list">
            <li onClick={() => handleCategory("자유")}>자유</li>
            <li onClick={() => handleCategory("후기")}>후기</li>
            <li onClick={() => handleCategory("질문")}>질문</li>
            <li onClick={() => handleCategory("전체")}>전체보기</li>
          </ul>
        </div>

        {/* 오른쪽 게시판 ------------------------------------------------ */}
        <div className="right-panel">

          {/* 공지 */}
          <div className="notice-section">
            {notices.map((n) => (
              <div key={n.id} className="notice-item">
                <div className="notice-title">- {n.title}</div>
                <div className="notice-info">{n.writer} | {n.date} | {n.views}</div>
              </div>
            ))}
          </div>

          <div className="divider"></div>

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
                  key={p.id}
                  className="post-row"
                  onClick={() => navigate(`/board/${p.id}`)}
                >
                  <div className="col-category">{p.category}</div>
                  <div className="col-title">{p.title}</div>
                  <div className="col-writer">{p.writer}</div>
                  <div className="col-date">{p.date}</div>
                  <div className="col-views">{p.views}</div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
                해당 카테고리의 글이 없습니다.
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

          <button className="write-btn"
          onClick={() => navigate("/board/write")}>글쓰기</button>
        </div>
      </div>
    </div>
  );
}
