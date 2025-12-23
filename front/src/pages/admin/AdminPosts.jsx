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

  return (
    <div className="admin-posts-container">
      <h1>관리자 게시글 관리</h1>

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
                onClick={() => openPostDetail(post.post_id)}
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

      {/* 게시글 상세 모달 */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedPost.title}</h2>

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
              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
            />

            <button className="close-btn" onClick={() => setSelectedPost(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
