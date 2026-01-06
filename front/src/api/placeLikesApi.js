import { http } from "./http";

function lsKey(userId) {
  return `likedPlaces_${userId || "guest"}`;
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

function extractList(res) {
  const raw = res?.data;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.list)) return raw.list;
  return [];
}

export const placeLikesApi = {
  toggle: async (payload) => {
    const res = await http.post("/place/likes", payload);

    setLocalLike(payload.userId, payload.contentId, payload.liked);
    return res;
  },

  meta: (params) => http.get("/place/likes/meta", { params }),

  listByUser: async (userId) => {
    const res = await http.get(`/place/likes/user/${userId}`);
    return extractList(res);
  },

  clearAll: async (userId) => {
    const res = await http.delete(`/place/likes/user/${userId}`);

    clearLocalLikes(userId);
    return res;
  },
};
