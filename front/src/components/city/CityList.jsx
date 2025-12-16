import React, { useState, useEffect } from "react";
import CityListItem from "./CityListItem";
import axios from "axios";
import "../../styles/page/city/CityList.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

export default function CityList({ filter, user }) {
  const { areaCode, sigunguCode, keyword } = filter;
  const contentTypeId = "";

  const [places, setPlaces] = useState([]);
  const [likedPlaceIds, setLikedPlaceIds] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------
     🔹 내가 좋아요한 여행지 ID 조회
  ----------------------------------*/
  useEffect(() => {
    if (!user?.user_id) {
      setLikedPlaceIds([]);
      return;
    }

    axios
      .get(`${API_BASE}/like/place/${user.user_id}`)
      .then((res) => {
        // place.external_id 기준으로 contentId 목록 만들기
        const ids = res.data
          .map((row) => row.place?.external_id)
          .filter(Boolean)
          .map(String);

        setLikedPlaceIds(ids);
      })
      .catch(() => {
        setLikedPlaceIds([]);
      });
  }, [user]);

  /* ---------------------------------
     🔹 좋아요 토글
  ----------------------------------*/
  const handleLikeToggle = async (placeInfo, newLiked, userId) => {
    if (!userId) {
      alert("로그인 후 좋아요 가능합니다.");
      return;
    }

    try {
      await axios.post(`${API_BASE}/like/place`, {
        userId,
        contentId: placeInfo.contentId,
        title: placeInfo.title,
        address: placeInfo.address,
        image: placeInfo.image,
        overview: placeInfo.overview,
        lat: placeInfo.latitude,
        lng: placeInfo.longitude,
        areaCode: placeInfo.areaCode,
        liked: newLiked,
      });

      setLikedPlaceIds((prev) =>
        newLiked
          ? [...prev, String(placeInfo.contentId)]
          : prev.filter((id) => id !== String(placeInfo.contentId))
      );
    } catch (err) {
      console.error("좋아요 토글 실패:", err);
    }
  };

  /* ---------------------------------
     🔹 관광지 목록 조회
  ----------------------------------*/
  useEffect(() => {
    if (!areaCode) {
      setPlaces([]);
      return;
    }

    async function fetchPlaces() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/place/places`, {
          params: {
            areaCode,
            sigunguCode,
            keyword: keyword || "",
            contentTypeId,
          },
        });

        setPlaces(res.data.slice(0, 10));
      } catch (e) {
        console.error("관광지 데이터 불러오기 실패", e);
      } finally {
        setLoading(false);
      }
    }

    fetchPlaces();
  }, [areaCode, sigunguCode, keyword]);

  if (loading) return <div>불러오는 중...</div>;

  const leftList = places.slice(0, 5);
  const rightList = places.slice(5, 10);

  return (
    <div className="city-list-grid">
      <div className="city-list-left">
        {leftList.map((p, idx) => (
          <CityListItem
            key={p.contentId}
            index={idx + 1}
            item={p}
            user={user}
            isLiked={likedPlaceIds.includes(String(p.contentId))}
            onLikeToggle={handleLikeToggle}
          />
        ))}
      </div>

      <div className="city-list-right">
        {rightList.map((p, idx) => (
          <CityListItem
            key={p.contentId}
            index={idx + 6}
            item={p}
            user={user}
            isLiked={likedPlaceIds.includes(String(p.contentId))}
            onLikeToggle={handleLikeToggle}
          />
        ))}
      </div>
    </div>
  );
}
