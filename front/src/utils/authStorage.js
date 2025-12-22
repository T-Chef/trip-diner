// src/utils/authStorage.js
export const clearAuth = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");

  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("likedPlaces")) localStorage.removeItem(k);
  });

  window.dispatchEvent(new Event("auth:logout"));
};

export const setAuth = ({ accessToken, user }) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(user));
};

export const getToken = () => localStorage.getItem("accessToken");

export const getUser = () => {
  const u = localStorage.getItem("user");
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
};
