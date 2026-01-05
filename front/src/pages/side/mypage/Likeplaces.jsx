// LikePlaces.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { placeLikesApi } from "../../../api/placeLikesApi";
import Header from "../../../components/home/Header.jsx";
import SideMenu from "../../../components/home/SideMenu.jsx";
import "../../../styles/side/mypage/Likeplaces.css";

export default function LikePlaces({ userId: userIdProp }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ userId prop이 없으면 localStorage에서 가져오게 (MyComments처럼)
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);
  const userId = userIdProp ?? storedUser?.user_id ?? storedUser?.id;

  // ✅ 사이드메뉴 토글
  const [menuOpen, setMenuOpen] = useState(false);

  const [places, setPlaces] = useState([]);
  const fallback = process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg";

  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!userId) return;

    placeLikesApi
      .listByUser(userId)
      .then((list) => {
      setPlaces(Array.isArray(list) ? list : []);
      setPage(1);
    })
    .catch((err) => console.error("여행지 좋아요 불러오기 에러:", err));
  }, [userId]);

  const safePlaces = useMemo(() => (Array.isArray(places) ? places : []), [places]);
  const totalPages = Math.ceil(safePlaces.length / itemsPerPage);

  const currentPlaces = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return safePlaces.slice(startIndex, startIndex + itemsPerPage);
  }, [safePlaces, page, itemsPerPage]);

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
      await placeLikesApi.toggle({ userId, contentId, liked: false });
      setPlaces((prev) => (Array.isArray(prev) ? prev.filter((x) => x.like_id !== row.like_id) : []));
    } catch {
      alert("취소 실패! 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <div
      className="places-like-bg"
      style={{
        backgroundImage: `url("${process.env.PUBLIC_URL}/assets/images/trip-bg.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="places-like-overlay" />

      <div className="mypage-topbar">
        <Header setMenuOpen={setMenuOpen} user={storedUser} />
        <SideMenu
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          user={storedUser}
          setUser={() => {}}
        />
      </div>

      <div className="places-like-content">
        <div className="places-like-box">
          <h2 className="likes-title">좋아요한 여행지</h2>

          <div className="like-grid">
            {currentPlaces.length === 0 && (
              <p className="empty-msg">아직 좋아요한 여행지가 없어요.</p>
            )}

            {currentPlaces.map((row) => (
              <div className="like-card" key={row.like_id} onClick={() => handleCardClick(row)}>
                <button type="button" className="like-remove-btn" onClick={(e) => handleUnlike(e, row)}>
                  ❤️
                </button>

                <img
                  src={row.place?.image_url || fallback}
                  className="like-img"
                  alt={row.place?.name || "place"}
                  onError={(e) => (e.currentTarget.src = fallback)}
                />

                <div className="like-info">
                  <h4>{row.place?.name}</h4>
                  <p>{row.place?.address}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
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

              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                {">"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
