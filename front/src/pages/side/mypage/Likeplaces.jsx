import { useEffect, useState } from "react";
import axios from "axios";
import "../../../styles/side/mypage/Likeplaces.css";

const API_BASE = "http://localhost:4000/api";

export default function LikePlaces({ userId }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchLiked() {
      try {
        const res = await axios.get(`${API_BASE}/place/like/place/${userId}`);

        console.log("좋아요 목록 응답:", res.data);

        // 서버가 BigInt → Number 변환한 데이터만 넣기
        const data = Array.isArray(res.data) ? res.data : [];

        setPlaces(data);
      } catch (err) {
        console.error("여행지 좋아요 불러오기 에러:", err);
        setPlaces([]); // 오류 발생 시 빈 배열로 처리
      } finally {
        setLoading(false);
      }
    }

    fetchLiked();
  }, [userId]);

  if (!userId) {
    return <p className="empty-msg">로그인 후 이용 가능합니다.</p>;
  }

  if (loading) {
    return <p className="empty-msg">불러오는 중...</p>;
  }

  return (
    <div className="likes-wrapper">
      <h2 className="likes-title">좋아요한 여행지</h2>

      <div className="like-grid">
        {places.length === 0 && (
          <p className="empty-msg">아직 좋아요한 여행지가 없어요.</p>
        )}

        {places.map((item) => {
          const place = item.place || {};

          const imgSrc =
            place.image_url && place.image_url.trim() !== ""
              ? place.image_url
              : "/images/no-image.png";

          return (
            <div className="like-card" key={String(item.like_id)}>
              <img
                src={imgSrc}
                className="like-img"
                alt={place.name || "장소 이미지"}
              />
              <div className="like-info">
                <h4>{place.name || "이름 없음"}</h4>
                <p>{place.address || "주소 없음"}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
