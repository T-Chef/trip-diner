// src/components/auth/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../../utils/authStorage";

export default function RequireAuth({ user, authLoading, children }) {
  const location = useLocation();

  if (authLoading) return null;

  const token = getToken();
  const isAuthed = !!user && !!token;

  if (!isAuthed) {
    const full = location.pathname + location.search + location.hash;
    sessionStorage.setItem("auth:from", full);
    return <Navigate to="/login" replace state={{ from: full }} />;
  }

  return children;
}
