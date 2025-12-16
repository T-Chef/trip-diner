import { useEffect, useState } from "react";
import axios from "axios";
import "../../../styles/side/mypage/Likeposts.css";

const API_BASE = "http://localhost:4000/api";

export default function LikePosts({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    async function fetchLikedPosts() {
      try {
        // ✅ 여기만 수정됨
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

  if (loading) {
    return <p className="empty-msg">불러오는 중...</p>;
  }

  return (
    <div className="likes-wrapper">
      <h2 className="likes-title">좋아요한 게시글</h2>

      <div className="like-grid">
        {posts.length === 0 && (
          <p className="empty-msg">아직 좋아요한 게시글이 없어요.</p>
        )}

        {posts.map((item) => (
          <div className="like-card" key={item.like_id}>
            <img
              src={
                item.post?.image_url
                  ? item.post.image_url
                  : "/images/no-image.png"
              }
              className="like-img"
              alt={item.post?.title}
            />
            <div className="like-info">
              <h4>{item.post?.title}</h4>
              <p>{item.post?.content?.slice(0, 40)}...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
