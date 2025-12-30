import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { placeLikesApi } from "../../../api/placeLikesApi";
import "../../../styles/side/mypage/Likeplaces.css";

export default function LikePlaces({ userId }) {
  const [places, setPlaces] = useState([]);
  const fallback = process.env.PUBLIC_URL + "/assets/images/default-thumb.jpg";
  const [clearingAll, setClearingAll] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!userId) return;

    placeLikesApi
      .listByUser(userId)
      .then((res) => setPlaces(res.data || []))
      .catch((err) => console.error("여행지 좋아요 불러오기 에러:", err));
  }, [userId]);

  const makeOverview = (title, address) => {
  const t = (title || "").trim();
  const a = (address || "").trim();
  if (a && t) return `${a}에 위치한 "${t}" 장소입니다.`;
  if (t) return `"${t}"에 대한 소개가 아직 준비 중인 장소입니다.`;
  return "이 장소에 대한 소개가 아직 준비 중입니다.";
};

  const handleCardClick = (likeRow) => {
    const p = likeRow?.place;
    if (!p) return;

    const contentId = p.external_id ? String(p.external_id) : null;
    if (!contentId) return;

    const typeFromDb = p.content_type_id ?? null;

    const basePlace = {
      contentId,
      title: p.name || "",
      address: p.address || "",
      image: p.image_url || null,
      latitude: p.lat ?? null,
      longitude: p.lng ?? null,
      tags: p.category ? [p.category] : ["여행지"],
      tel: p.tel || "",
      overview: makeOverview(p.name, p.address),   
      contentTypeId: typeFromDb,
    };

    const params = new URLSearchParams(location.search);
    if (typeFromDb && !params.get("type")) params.set("type", String(typeFromDb));

    navigate(`/place/${contentId}${params.toString() ? `?${params.toString()}` : ""}`, {
      state: { basePlace, from: location },
    });
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
        title: p.name,
        address: p.address,
        image: p.image_url,
        lat: p.lat,
        lng: p.lng,
        category: p.category,
        cityId: p.city_id ?? null,
        contentTypeId: p.content_type_id ?? null,
      });

      setPlaces((prev) => prev.filter((x) => x.like_id !== row.like_id));
    } catch (err) {
      console.error("좋아요 취소 실패", err);
      alert("취소에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const handleClearAll = async () => {
    if (!userId) return;
    if (places.length === 0) return;

  const ok = window.confirm(`좋아요 ${places.length}개를 전부 취소할까요?`);
  if (!ok) return;

  setClearingAll(true);

  try {
    await placeLikesApi.clearAll(userId);
    setPlaces([]);
  } catch (err) {
    console.error("전체 취소 실패", err);
    alert("전체 취소 중 오류가 발생했어요.");
  } finally {
    setClearingAll(false);
  }
};

  return (
    <div className="likes-wrapper">
      <h2 className="likes-title">좋아요한 여행지</h2>
       <button
        type="button"
        className="likes-clear-btn"
        onClick={handleClearAll}
        disabled={clearingAll || places.length === 0}
      >
        {clearingAll ? "취소 중..." : "전체 취소"}
      </button>

      <div className="like-grid">
        {places.length === 0 && (
          <p className="empty-msg">아직 좋아요한 여행지가 없어요.</p>
        )}

        {places.map((row) => (
          <div
            className="like-card"
            key={row.like_id}
            onClick={() => handleCardClick(row)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCardClick(row);
            }}
          >
            <button
              type="button"
              className="like-remove-btn"
              onClick={(e) => handleUnlike(e, row)}
              aria-label="좋아요 취소"
              title="좋아요 취소"
            >
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
    </div>
  );
}

