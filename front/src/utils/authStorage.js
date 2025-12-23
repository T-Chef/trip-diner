// src/utils/authStorage.js
const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const setAuth = ({ accessToken, user }) => {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  // (선택) 유저별 캐시 정리
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("likedPlaces")) localStorage.removeItem(k);
  });
};
