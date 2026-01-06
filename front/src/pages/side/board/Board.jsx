import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../../../styles/side/board/Board.css";

export default function Board() {
  const navigate = useNavigate();
  const { category: urlCategory } = useParams();

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [user] = useState(storedUser);

  const PROFILE_BASE_URL = "http://localhost:4000";
  const profileSrc = user?.profile_img
    ? user.profile_img.startsWith(PROFILE_BASE_URL)
      ? user.profile_img
      : `${PROFILE_BASE_URL}${user.profile_img.startsWith("/") ? "" : "/"}${
          user.profile_img
        }`
    : "/default_profile.png";

  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  // 게시글 불러오기
  useEffect(() => {
    axios
      .get("http://localhost:4000/api/posts")
      .then((res) => setPosts(res.data))
      .catch((err) => console.error("글 불러오기 오류:", err));
  }, []);

  // URL 카테고리 반영
  useEffect(() => {
    if (urlCategory) {
      setCategory(urlCategory === "전체" ? "전체" : urlCategory);
    } else {
      setCategory("전체");
    }

    setCurrentPage(1);
  }, [urlCategory]);

  const handleCategoryChange = (cat) => {
    const targetPath = cat === "전체보기" ? "전체" : cat;
    navigate(`/board/list/${targetPath}`);
  };

  const filteredPosts =
    category === "전체" || category === "전체보기"
      ? posts
      : posts.filter((p) => p.category === category);

  const indexOfLast = currentPage * postsPerPage;
  const indexOfFirst = indexOfLast - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;

  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const currentCategoryLabel =
    category === "전체" || category === "전체보기"
      ? "전체 게시글"
      : `${category} 게시글`;

  return (
    <div className="board-page">
      <div className="board-wrapper">
        <div className="board-banner">
          <div className="board-banner-inner">
            <div className="board-banner-left">
              <h1 className="board-main-title">여행자들의 이야기 보드</h1>

              <p className="board-main-sub">
                다녀온 여행 후기부터 궁금한 점, 다음 여행 계획까지. 당신의 여행
                한 장면을 이곳에 남겨보세요.
              </p>

              <div className="board-banner-tags">
                <span>#자유게시판</span>
                <span>#여행후기</span>
                <span>#질문공유</span>
              </div>
            </div>
          </div>
        </div>

        <div className="board-layout">
          <div className="left-panel">
            <div className="board-profile-view">
              <div className="profile-circle">
                <img src={profileSrc} alt="프로필" />
              </div>

              <div className="board-profile-name">{user?.name} 님</div>

              <div className="board-profile-welcome">
                환영합니다 {user?.name}님!
              </div>
            </div>

            <ul className="category-list">
              {["전체보기", "자유", "후기", "질문"].map((cat) => (
                <li
                  key={cat}
                  className={
                    category === cat ||
                    (category === "전체" && cat === "전체보기")
                      ? "active"
                      : ""
                  }
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat}
                </li>
              ))}
            </ul>
          </div>

          <div className="right-panel">
            <div className="board-top-info">
              <div className="board-current-category">
                현재 카테고리
                <span className="chip">{currentCategoryLabel}</span>
              </div>

              <div className="board-count-info">
                총 {filteredPosts.length}개의 글이 있습니다.
              </div>
            </div>

            <div className="board-list-card">
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

                      <div className="col-title">
                        {p.title}
                        {p._count?.comment > 0 && (
                          <span className="comment-count">
                            [{p._count.comment}]
                          </span>
                        )}
                      </div>

                      <div className="col-writer">{p.user?.name || "익명"}</div>
                      <div className="col-date">
                        {p.created_at?.slice(0, 10)}
                      </div>
                      <div className="col-views">{p.views || 0}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-posts">
                    해당 카테고리에 게시글이 없습니다.
                  </div>
                )}
              </div>
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
