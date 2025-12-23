// src/api/axiosInstance.js
import axios from "axios";
import { getToken, clearAuth } from "../utils/authStorage";

const api = axios.create({
  baseURL: "http://localhost:8080", // 제일 확실
  // baseURL: "", // 프록시 쓰면 이것도 가능
});

api.interceptors.request.use((config) => {
  const token = getToken() || localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const hasToken = !!getToken();

    if (hasToken && (status === 401 || status === 403)) {
      const fullPath = window.location.pathname + window.location.search + window.location.hash;
      sessionStorage.setItem("auth:from", fullPath);

      clearAuth();

      window.dispatchEvent(new Event("auth:logout"));

      const fromQ = encodeURIComponent(fullPath);
      window.location.replace(`/login?from=${fromQ}`);
    }

    return Promise.reject(error);
  }
);

export default api;
