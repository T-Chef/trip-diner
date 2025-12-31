import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import "../../../styles/side/mypage/Likeposts.css";

const API_BASE = "http://localhost:4000/api";

export default function LikePosts({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();


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
        {posts.map((item) => (
          <div 
            className="like-card" 
            key={item.like_id}
            onClick={() => {
              const postId = item.post?.post_id || item.post_id; 
              if (postId) {
                navigate(`/board/${postId}`); 
              } else {
                console.error("게시글 ID를 찾을 수 없습니다.");
              }
            }}
          >
            <div className="like-img-wrapper">
              <img
                src={
                  item.post?.image_url 
                    ? `http://localhost:4000${item.post.image_url}` 
                    : getFirstImage(item.post?.content)
                }
                className="like-img"
                alt={item.post?.title}
                onError={(e) => e.target.src = "https://via.placeholder.com/300x200?text=No+Image"}
              />
            </div>
            
            <div className="like-info">
              <h4 className="like-post-title">{item.post?.title || "제목 없음"}</h4>
            </div>
            <div className="like-arrow">&gt;</div>
          </div>
        ))}
      </div>
    </div>
  );
}