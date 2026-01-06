import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminPosts.css";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 8;
  const indexOfLast = currentPage * perPage;
  const indexOfFirst = indexOfLast - perPage;
  const currentPosts = posts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(posts.length / perPage);

  const fetchPosts = async () => {
    const res = await axios.get("http://localhost:4000/api/admin/posts");
    setPosts(res.data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (postId) => {
    if (!window.confirm("이 게시글을 삭제하시겠습니까?")) return;
    await axios.patch(`http://localhost:4000/api/admin/posts/${postId}/delete`);
    fetchPosts();
  };

  const handleRestore = async (postId) => {
    if (!window.confirm("이 게시글을 복구하시겠습니까?")) return;
    await axios.patch(
      `http://localhost:4000/api/admin/posts/${postId}/restore`
    );
    fetchPosts();
  };

  const openPostDetail = async (postId, deleted) => {
    if (deleted === 1) {
      alert("임시 삭제된 게시글은 내용을 확인할 수 없습니다.");
      return;
    }

    const res = await axios.get(`http://localhost:4000/api/posts/${postId}`);
    setSelectedPost(res.data);
  };

  const bgStyle = {
    backgroundImage: `url(${process.env.PUBLIC_URL}/assets/images/trip-back.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="admin-bg" style={bgStyle}>
      <div className="admin-overlay" />

      <div className="admin-posts-wrapper">
        <h1 className="admin-title">관리자 게시글 관리</h1>

        <div className="admin-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>카테고리</th>
                <th>상태</th>
                <th>작성일</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {currentPosts.map((post) => (
                <tr
                  key={post.post_id}
                  className={post.deleted === 1 ? "deleted-row" : ""}
                >
                  <td>{post.post_id}</td>

                  <td
                    className="post-title-link"
                    onClick={() => openPostDetail(post.post_id, post.deleted)}
                    style={{ cursor: "pointer", color: "#6b5dff" }}
                  >
                    {post.title}
                  </td>

                  <td>{post.category}</td>
                  <td>{post.deleted === 1 ? "삭제됨" : "정상"}</td>
                  <td>{post.created_at?.slice(0, 10)}</td>

                  <td>
                    {post.deleted === 0 ? (
                      <button
                        className="danger-btn"
                        onClick={() => handleDelete(post.post_id)}
                      >
                        삭제
                      </button>
                    ) : (
                      <button
                        className="success-btn"
                        onClick={() => handleRestore(post.post_id)}
                      >
                        복구
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="admin-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? "active" : ""}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              &gt;
            </button>
          </div>
        </div>

        {selectedPost && (
          <div className="admin-modal-back">
            <div className="admin-modal">
              <h2>{selectedPost.title}</h2>

              <p style={{ color: "#666" }}>
                카테고리: {selectedPost.category} / 작성자:{" "}
                {selectedPost.user?.name} / 작성일:{" "}
                {selectedPost.created_at?.slice(0, 10)}
              </p>

              {selectedPost.image_url && (
                <img
                  src={`http://localhost:4000${selectedPost.image_url}`}
                  alt="게시글 이미지"
                  style={{
                    maxWidth: "350px",
                    borderRadius: "8px",
                    margin: "10px 0",
                  }}
                />
              )}

              <div
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  borderRadius: "10px",
                  background: "#fafafa",
                  border: "1px solid #ddd",
                }}
              />

              <button
                className="admin-modal-close"
                onClick={() => setSelectedPost(null)}
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
