import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { placeLikesApi } from "../../../api/placeLikesApi";
import "../../../styles/side/mypage/Likeplaces.css";

export default function LikePlaces({ userId }) {
  const [places, setPlaces] = useState([]);
  const fallback = process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg";

  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!userId) return;

    placeLikesApi
      .listByUser(userId)
      .then((res) => setPlaces(res.data || []))
      .catch((err) => console.error("여행지 좋아요 불러오기 에러:", err));
  }, [userId]);

  const totalPages = Math.ceil(places.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const currentPlaces = places.slice(startIndex, startIndex + itemsPerPage);

  const handleCardClick = (row) => {
    const p = row?.place;
    if (!p) return;

    const contentId = p.external_id ? String(p.external_id) : null;
    if (!contentId) return;

    navigate(`/place/${contentId}`, { state: { from: location } });
  };

  const handleUnlike = async (e, row) => {
    e.stopPropagation();
    const p = row?.place;
    if (!p) return;

    const contentId = p.external_id ? String(p.external_id) : null;
    if (!contentId) return;

    try {
      await placeLikesApi.toggle({
        userId,
        contentId,
        liked: false,
      });

      setPlaces((prev) => prev.filter((x) => x.like_id !== row.like_id));
    } catch {
      alert("취소 실패! 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div
      className="places-like-bg"
      style={{
        backgroundImage: 'url("/assets/images/trip-bg.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* 어두운 레이어 */}
      <div className="places-like-overlay" />

      {/* 🔥 상단 TripDiner 헤더 영역 (MyComments / MyPosts 동일 구조) */}
      <div className="mypage-topbar">
        <img
          src="/assets/images/logo.png"
          alt="TripDiner"
          className="mypage-logo"
          onClick={() => navigate("/")}
        />
        <img
          src="/assets/images/plate.png"
          alt="icon"
          className="mypage-icon"
        />
      </div>

      {/* 🔥 흰 박스 */}
      <div className="places-like-box">
        <h2 className="likes-title">좋아요한 여행지</h2>

        <div className="like-grid">
          {currentPlaces.length === 0 && (
            <p className="empty-msg">아직 좋아요한 여행지가 없어요.</p>
          )}

          {currentPlaces.map((row) => (
            <div
              className="like-card"
              key={row.like_id}
              onClick={() => handleCardClick(row)}
            >
              <button
                type="button"
                className="like-remove-btn"
                onClick={(e) => handleUnlike(e, row)}
              >
                ❤️
              </button>

              <img
                src={row.place?.image_url || fallback}
                className="like-img"
                alt={row.place?.name}
                onError={(e) => (e.currentTarget.src = fallback)}
              />

              <div className="like-info">
                <h4>{row.place?.name}</h4>
                <p>{row.place?.address}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>
              {"<"}
            </button>

            {[...Array(totalPages)].map((_, i) => (
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
              onClick={() => setPage(page + 1)}
            >
              {">"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
