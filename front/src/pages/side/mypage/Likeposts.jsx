import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../../styles/side/mypage/Likeposts.css";

const API_BASE = "http://localhost:4000/api";

export default function LikePosts({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const getFirstImage = (content) => {
    if (!content) return "https://via.placeholder.com/300x200?text=No+Image";
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const match = imgRegex.exec(content);
    return match
      ? match[1]
      : "https://via.placeholder.com/300x200?text=No+Image";
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
      } catch (err) {
        console.error("게시글 좋아요 불러오기 에러:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchLikedPosts();
  }, [userId]);

  if (loading) return <p className="empty-msg">불러오는 중...</p>;

  const startIndex = (page - 1) * itemsPerPage;
  const currentPosts = posts.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(posts.length / itemsPerPage);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        backgroundImage: `url("/assets/images/trip-bg.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2, paddingTop: "80px" }}>
        <div className="likes-box">
          <h2 className="likes-title">좋아요한 게시글</h2>

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
                {/* ❤️ 하트 위치 동일 */}
                <button className="like-remove-btn">❤️</button>

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
                      (e.target.src =
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

          {/* 페이지네이션 — LikePlaces와 동일 style */}
          {totalPages > 1 && (
            <div className="likes-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {"<"}
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <span
                  key={i}
                  className={page === i + 1 ? "active" : ""}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </span>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {">"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
