import { useEffect, useState } from "react";
import axios from "axios";
import "../../../styles/side/mypage/Likeplaces.css";

const API_BASE = "http://localhost:4000/api";

export default function LikePlaces({ userId }) {
  const [places, setPlaces] = useState([]);
  const fallback = process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg";

  useEffect(() => {
    if (!userId) return; // userId 없으면 API 호출하지 않음

    axios
      .get(`${API_BASE}/place/like/${userId}`)
      .then((res) => {
        setPlaces(res.data);
      })
      .catch((err) => console.error("여행지 좋아요 불러오기 에러:", err));
  }, [userId]); // userId가 변경될 때만 실행

  return (
    <div className="likes-wrapper">
      <h2 className="likes-title">좋아요한 여행지</h2>

      <div className="like-grid">
        {places.length === 0 && (
          <p className="empty-msg">아직 좋아요한 여행지가 없어요.</p>
        )}

        {places.map((item) => (
          <div className="like-card" key={item.like_id}>
            <img
              src={item.place?.image_url || fallback}
              className="like-img"
              alt={item.place?.name}
              onError={(e) => (e.currentTarget.src = fallback)}
            />
            <div className="like-info">
              <h4>{item.place?.name}</h4>
              <p>{item.place?.address}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}