import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Header from "../../../components/home/Header.jsx";
import SideMenu from "../../../components/home/SideMenu.jsx";
import "../../../styles/side/mypage/Likeposts.css";

const API_BASE = "http://localhost:4000/api";

export default function LikePosts({ userId: userIdProp }) {
  const navigate = useNavigate();

  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const userId = userIdProp ?? storedUser?.user_id ?? storedUser?.id;

  const [menuOpen, setMenuOpen] = useState(false);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const getFirstImage = (content) => {
    if (!content) return "https://via.placeholder.com/300x200?text=No+Image";
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = imgRegex.exec(content);
    return match ? match[1] : "https://via.placeholder.com/300x200?text=No+Image";
  };

  useEffect(() => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    async function fetchLikedPosts() {
      try {
        const res = await axios.get(`${API_BASE}/like/post/${userId}`);
        setPosts(Array.isArray(res.data) ? res.data : []);
        setPage(1);
      } catch (err) {
        console.error("게시글 좋아요 불러오기 에러:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLikedPosts();
  }, [userId]);

  const startIndex = (page - 1) * itemsPerPage;
  const currentPosts = posts.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(posts.length / itemsPerPage);

  return (
    <div
      className="likes-bg"
      style={{
        backgroundImage: `url("${process.env.PUBLIC_URL}/assets/images/trip-bg.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="likes-overlay" />

      <div className="mypage-topbar">
        <Header setMenuOpen={setMenuOpen} user={storedUser} />
        <SideMenu
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          user={storedUser}
          setUser={() => {}}
        />
      </div>

      <div className="likes-content">
        <div className="likes-box">
          <h2 className="likes-title">좋아요한 게시글</h2>

          {loading ? (
            <p className="empty-msg">불러오는 중...</p>
          ) : (
            <>
              <div className="like-grid">
                {currentPosts.length === 0 && (
                  <p className="empty-msg">아직 좋아요한 게시글이 없습니다.</p>
                )}

                {currentPosts.map((item) => (
                  <div
                    className="like-card"
                    key={item.like_id}
                    onClick={() => {
                      const postId = item.post?.post_id || item.post_id;
                      if (postId) navigate(`/board/${postId}`);
                    }}
                  >
                    <button type="button" className="like-remove-btn">
                      ❤️
                    </button>

                    <div className="like-img-wrapper">
                      <img
                        src={
                          item.post?.image_url
                            ? `http://localhost:4000${item.post.image_url}`
                            : getFirstImage(item.post?.content)
                        }
                        className="like-img"
                        alt={item.post?.title}
                        onError={(e) =>
                          (e.currentTarget.src =
                            "https://via.placeholder.com/300x200?text=No+Image")
                        }
                      />
                    </div>

                    <div className="like-info">
                      <h4 className="like-post-title">
                        {item.post?.title || "제목 없음"}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="likes-pagination">
                  <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    {"<"}
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={page === i + 1 ? "active" : ""}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {">"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
