// src/api/authApi.js
import api from "./axiosInstance";

// ✅ Spring이 Node 형식으로 응답하면, 여기서도 Node처럼 쓰면 됨
export const login = (email, password) =>
  api.post("/api/auth/login", { email, password });

// ✅ token 파라미터 필요 없음 (인터셉터가 Bearer 자동 첨부)
export const me = () =>
  api.get("/api/auth/me");

// ✅ 아직 Spring에 없으면 당장은 프론트에서 안 쓰거나, 나중에 Spring에 동일 엔드포인트 만들기
export const checkEmailDuplicate = (email) =>
  api.get("/api/auth/check-email", { params: { email } });

export const register = (name, email, password) =>
  api.post("/api/auth/register", { name, email, password });
