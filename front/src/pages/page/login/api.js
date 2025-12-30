// front/src/pages/page/login/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null; // ✅ refresh 동시 호출 방지

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // refresh 자체 실패면: 로그인 풀기
    if (original?.url?.includes("/auth/refresh")) {
      localStorage.removeItem("accessToken");
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        // ✅ refresh는 무조건 1번만 실행되게
        if (!refreshPromise) {
          refreshPromise = api.post("/auth/refresh");
        }

        const r = await refreshPromise;
        const newToken = r.data.accessToken;

        localStorage.setItem("accessToken", newToken);
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);
      } catch (e) {
        // refresh 자체가 안 되면 로그인 만료 처리
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        return Promise.reject(e);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
