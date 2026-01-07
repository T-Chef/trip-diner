import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    alert("관리자 인증이 필요합니다.");
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
