// src/pages/pw/PwApi.js
import axios from "axios";

// 🔍 포트 번호를 포함한 전체 서버 주소를 적어주세요.
const API = "http://localhost:4000/api/auth"; 

export const requestResetEmail = (email) => {
  return axios.post(`${API}/forgot-password`, { email });
};

export const resetPassword = (token, password) => {
  // 🔍 서버로 token과 password가 담긴 객체가 전달됩니다.
  return axios.post(`${API}/reset-password`, { token, password });
};

export const checkEmailDuplicate = (email) =>
  axios.get(`${API}/check-email`, { params: { email } });

