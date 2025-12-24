// front/src/api/placeLikesApi.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000/api";

function lsKey(userId) {
  return `likedPlaces_${userId || "guest"}`;
}

function getToken() {
  return localStorage.getItem("accessToken");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function setLocalLike(userId, contentId, liked) {
  const key = lsKey(userId);
  const saved = JSON.parse(localStorage.getItem(key) || "[]").map(String);

  const cid = String(contentId);

  const updated = liked
    ? Array.from(new Set([...saved, cid]))
    : saved.filter((id) => id !== cid);

  localStorage.setItem(key, JSON.stringify(updated));

  window.dispatchEvent(
    new CustomEvent("placeLikesChanged", { detail: { userId } })
  );
}

function clearLocalLikes(userId) {
  const key = lsKey(userId);
  localStorage.setItem(key, JSON.stringify([]));
  window.dispatchEvent(
    new CustomEvent("placeLikesChanged", { detail: { userId } })
  );
}

export const placeLikesApi = {
  toggle: async (payload) => {
    const res = await axios.post(`${API_BASE}/place/likes`, payload, {
      headers: authHeaders(),
    });

    setLocalLike(payload.userId, payload.contentId, payload.liked);
    return res;
  },

  meta: (params) =>
    axios.get(`${API_BASE}/place/likes/meta`, {
      params,
      headers: authHeaders(),
    }),

  listByUser: (userId) =>
    axios.get(`${API_BASE}/place/likes/user/${userId}`, {
      headers: authHeaders(),
    }),

  clearAll: async (userId) => {
    const res = await axios.delete(`${API_BASE}/place/likes/user/${userId}`, {
      headers: authHeaders(),
    });

    clearLocalLikes(userId);
    return res;
  },
};
