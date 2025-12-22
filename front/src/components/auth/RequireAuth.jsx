import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, getUser } from "../../utils/authStorage";

export default function RequireAuth({ children }) {
  const location = useLocation();

  const authed = !!getToken() && !!getUser();

  if (!authed) {
    const from = `${location.pathname}${location.search}${location.hash}`;

    return <Navigate to="/login" replace state={{ from }} />;
  }

  return children;
}
