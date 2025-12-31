import axios from "axios";

const API = "/api/auth";

export const requestResetEmail = (email) => {
  return axios.post(`${API}/forgot-password`, { email });
};

export const resetPassword = (token, password) => {
  return axios.post(`${API}/reset-password`, { token, password });
};

export const checkEmailDuplicate = (email) =>
  axios.get(`${API}/check-email`, { params: { email } });


