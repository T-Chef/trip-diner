// src/api/axiosInstance.js
import axios from "axios";
import { getToken, clearAuth } from "../utils/authStorage";

const api = axios.create({
});

api.interceptors.request.use((config) => {
  const token = getToken();
  config.headers = config.headers ?? {};
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const hasToken = !!getToken();

    if (hasToken && (status === 401 || status === 403)) {
      clearAuth();
      window.dispatchEvent(new Event("auth:logout"));

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
