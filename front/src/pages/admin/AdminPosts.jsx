import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminPosts.css";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

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

  const openPostDetail = async (postId) => {
    const res = await axios.get(`http://localhost:4000/api/posts/${postId}`);
    setSelectedPost(res.data);
  };

  const closeModal = () => {
    setSelectedPost(null);
  };

  return (
    <div className="admin-posts-page">
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
            {posts.map((post) => (
              <tr
                key={post.post_id}
                className={post.deleted === 1 ? "deleted-row" : ""}
              >
                <td>{post.post_id}</td>
                <td
                  className="post-title-link"
                  onClick={() => {
                    if (post.deleted === 1) {
                      alert("임시 삭제된 게시글은 내용을 확인할 수 없습니다.");
                      return;
                    }
                    openPostDetail(post.post_id);
                  }}
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
      </div>

      {selectedPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{selectedPost.title}</h2>

            <div className="modal-meta">
              <span>카테고리: {selectedPost.category}</span>
              <span>작성자: {selectedPost.user?.name}</span>
              <span>작성일: {selectedPost.created_at?.slice(0, 10)}</span>
            </div>

            {selectedPost.image_url && (
              <img
                src={`http://localhost:4000${selectedPost.image_url}`}
                alt="게시글 이미지"
                className="modal-image"
              />
            )}

            <div
              className="modal-content"
              dangerouslySetInnerHTML={{
                __html: selectedPost.content,
              }}
            />

            <div className="modal-actions">
              <button className="close-btn" onClick={closeModal}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
