import axios from "axios";

// 공통 기본 주소
const API = "/api/auth";

// 비밀번호 재설정 이메일 요청
export const requestResetEmail = (email) => {
  return axios.post(`${API}/forgot-password`, { email });
};

// 비밀번호 변경
export const resetPassword = (token, password) => {
  return axios.post(`${API}/reset-password`, { token, password });
};

// 이메일 중복 체크
export const checkEmailDuplicate = (email) => {
  return axios.get(`${API}/check-email`, { params: { email } });
};


